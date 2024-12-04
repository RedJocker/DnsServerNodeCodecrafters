import dgram from "dgram"
import { HeaderBuilder, Header } from "./header.js";
import { Question } from "./question.js";
import { Answer } from "./answer.js";
import { EventEmitter } from 'node:events';

const customEventsEmmitter = new EventEmitter();
let customPacketIdentifier = 0;

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");


const servingSocket = dgram.createSocket("udp4");
servingSocket.bind(2053, "127.0.0.1");

const resolverSocket = dgram.createSocket("udp4");
const [ipResolver, portStrResolver] = process.argv[3].split(':', 2)
const portResolver = parseInt(portStrResolver)
resolverSocket.connect(portResolver, ipResolver);

servingSocket.on("message", (buf, rinfo) => {
  try {
    const {header: requestHeader, len: headerOffset} = Header.fromBuffer(buf, 0)
    console.log(`requestHeaderClient: ${requestHeader}`)
    
    let offset = headerOffset
    const requestQuestions = []
    for (let i = 0; i < requestHeader.questionCount; i++) {
      const {question, len} = Question.fromBuffer(buf, offset)
      requestQuestions.push(question)
      offset += len;
    }
    requestQuestions.forEach(q => console.log(`question: ${q.toString()}`))
    customEventsEmmitter.emit('forward', rinfo, requestHeader, requestQuestions)
  } catch (e) {
    console.log(`Error receiving data from client: ${e}`);
  }
});

const isUnsupportedOperation = (header) => header.operationCode != 0

const respondUnsupportedOperation = (requestHeader, rinfo) => {
  const responseHeader = new HeaderBuilder()
        .setPacketIdentifier(requestHeader.packetIdentifier)
        .setQueryOrResponseIndicator(1)
        .setOperationCode(requestHeader.operationCode)
        .setQuestionCount(0)
        .setAnswerRecordCount(0)
        .setRecursionDesired(requestHeader.recursionDesired)
        .setPacketIdentifier(requestHeader.packetIdentifier)
        .setResponseCode(4)
        .build();
  console.log(`responseHeader opcode!=0: ${responseHeader.toString()}`)
  const buffersToResponse = responseHeader.toBuffer()
  console.log(buffersToResponse)
  servingSocket.send(buffersToResponse, rinfo.port, rinfo.address);
}

const respondAllQuestions = (requestHeader, requestQuestions, responseAnswers, rinfo) => {
  const responseHeader = new HeaderBuilder()
          .setPacketIdentifier(requestHeader.packetIdentifier)
          .setQueryOrResponseIndicator(1)
          .setRecursionDesired(requestHeader.recursionDesired)
          .setOperationCode(requestHeader.operationCode)
          .setQuestionCount(requestHeader.questionCount)
          .setAnswerRecordCount(requestHeader.questionCount)
          .setPacketIdentifier(requestHeader.packetIdentifier)
          .build();
  console.log(`responseHeaderClient: ${responseHeader}`)
  const responseHeaderBuffer = responseHeader.toBuffer()
  console.log(responseHeaderBuffer)
  const questionBufferArr = requestQuestions.map(q => q.toBuffer())
  
  const answerBufferArr = responseAnswers.map(a => a.toBuffer())
  const buffersToResponse = [responseHeaderBuffer, ...questionBufferArr, ...answerBufferArr]
  const totalLen = buffersToResponse.reduce((a,c) => a + c.length, 0)
  const bufferToResponse = Buffer.concat(buffersToResponse, totalLen)
  console.log(bufferToResponse)
  servingSocket.send(bufferToResponse, rinfo.port, rinfo.address)
}

customEventsEmmitter.on('forward', (rinfo, requestHeader, requestQuestions) => {

  if (isUnsupportedOperation(requestHeader)) {
    respondUnsupportedOperation(requestHeader, rinfo)
    return ;
  }
  
  const answers = []
  requestQuestions.forEach((question, i) => {
    const forwardHeader = new HeaderBuilder()
      .setQueryOrResponseIndicator(0)
      .setQuestionCount(1)
      .setPacketIdentifier(customPacketIdentifier++)
      .build();
    console.log(`forwardHeader: ${forwardHeader.toString()}`)
    const headerBuffer = forwardHeader.toBuffer()
    console.log(headerBuffer)
    console.log(`question-${i}: ${question.toString()}`)
    const questionBuffer = question.toBuffer();
    console.log(questionBuffer)
    const buffersToForward = [headerBuffer, questionBuffer]
    const totalLen = buffersToForward.reduce((a,c) => a + c.length, 0)
    const bufferToForward = Buffer.concat(buffersToForward, totalLen)
    
    const receivedPacketWithId = `received-${forwardHeader.packetIdentifier}`
    customEventsEmmitter.on(receivedPacketWithId, (answer) => {
      answers.push(answer)
      if (answers.length >= requestHeader.questionCount) {
        customEventsEmmitter.removeAllListeners(receivedPacketWithId)
        respondAllQuestions(requestHeader, requestQuestions, answers, rinfo)
      }
    })

    console.log(bufferToForward)
    resolverSocket.send(bufferToForward);
  })
})

resolverSocket.on("message", (buf, rinfo) => {
  try {
    const {header: responseHeader, len: headerOffset} = Header.fromBuffer(buf, 0)
    console.log(`responseHeaderResolver: ${responseHeader}`)
    const headerBuffer = responseHeader.toBuffer()
    console.log(headerBuffer)
    let offset = headerOffset
    
    const {question, len: lenQuestion} = Question.fromBuffer(buf, offset)
    offset += lenQuestion;
    
    console.log(`question: ${question.toString()}`)
    const {answer, len1: lenAnswer} = Answer.fromBuffer(buf, offset)  
    offset += lenAnswer;
    console.log(`answer: ${answer.toString()}`)
    const receivedPacketWithId = `received-${responseHeader.packetIdentifier}`
    customEventsEmmitter.emit(receivedPacketWithId, answer)
  } catch (e) {
    console.log(`Error receiving data from resolver: ${e}`);
  }
});

servingSocket.on("error", (err) => {
  console.log(`Error: ${err}`);
});

servingSocket.on("listening", () => {
  const address = servingSocket.address();
  console.log(`Server listening ${address.address}:${address.port}`);
});

resolverSocket.on("error", (err) => {
  console.log(`Resolver error: ${err}`);
});

resolverSocket.on("connect", () => {
  const address = resolverSocket.address();
  console.log(`Resolver connected ${address.address}:${address.port}`);
});






/*
Field 	Size 	Description
Packet Identifier (ID) 	16 bits 	A random ID assigned to query packets. Response packets must reply with the same ID.
Expected value: 1234.
Query/Response Indicator (QR) 	1 bit 	1 for a reply packet, 0 for a question packet.
Expected value: 1.
Operation Code (OPCODE) 	4 bits 	Specifies the kind of query in a message.
Expected value: 0.
Authoritative Answer (AA) 	1 bit 	1 if the responding server "owns" the domain queried, i.e., it's authoritative.
Expected value: 0.
Truncation (TC) 	1 bit 	1 if the message is larger than 512 bytes. Always 0 in UDP responses.
Expected value: 0.
Recursion Desired (RD) 	1 bit 	Sender sets this to 1 if the server should recursively resolve this query, 0 otherwise.
Expected value: 0.
Recursion Available (RA) 	1 bit 	Server sets this to 1 to indicate that recursion is available.
Expected value: 0.
Reserved (Z) 	3 bits 	Used by DNSSEC queries. At inception, it was reserved for future use.
Expected value: 0.
Response Code (RCODE) 	4 bits 	Response code indicating the status of the response.
Expected value: 0 (no error).
Question Count (QDCOUNT) 	16 bits 	Number of questions in the Question section.
Expected value: 0.
Answer Record Count (ANCOUNT) 	16 bits 	Number of records in the Answer section.
Expected value: 0.
Authority Record Count (NSCOUNT) 	16 bits 	Number of records in the Authority section.
Expected value: 0.
Additional Record Count (ARCOUNT) 	16 bits 	Number of records in the Additional section.
Expected value: 0.
*/