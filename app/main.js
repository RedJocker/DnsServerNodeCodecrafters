import dgram from "dgram"
import { HeaderBuilder, Header } from "./header.js";
import { Question } from "./question.js";
import { Answer } from "./answer.js";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const udpSocket = dgram.createSocket("udp4");
udpSocket.bind(2053, "127.0.0.1");

udpSocket.on("message", (buf, rinfo) => {
  try {
    const {header: requestHeader, len: headerOffset} = Header.fromBuffer(buf, 0)
    console.log(`requestHeader: ${requestHeader}`)
    
    let offset = headerOffset
    const questions = []
    for (let i = 0; i < requestHeader.questionCount; i++) {
      const {question, len} = Question.fromBuffer(buf, offset)
      questions.push(question)
      offset += len;
    }
    questions.forEach(q => console.log(`question: ${q.toString()}`))
    
    const answers = questions.map(q => q.toAnswer())
    
    const responseHeader = new HeaderBuilder()
      .setPacketIdentifier(requestHeader.packetIdentifier)
      .setOperationCode(requestHeader.operationCode)
      .setRecursionDesired(requestHeader.recursionDesired)
      .setResponseCode(requestHeader.operationCode == 0 ? 0 : 4)
      .setQuestionCount(questions.length)
      .setAnswerRecordCount(answers.length)
      .build()
    
    console.log(`responseHeader: ${responseHeader.toString()}`)
    const headerBuffer = responseHeader.toBuffer()
    console.log(headerBuffer)
    
    answers.forEach(a => console.log(`answer: ${a.toString()}`))
    const buffersToSend = [headerBuffer, ...(questions.map(q => q.toBuffer())), ...(answers.map(a => a.toBuffer()))]
    const totalLen = buffersToSend.reduce((a,c) => a + c.length, 0)
    const bufferToSend = Buffer.concat(buffersToSend, totalLen)
    console.log(bufferToSend)
    udpSocket.send(bufferToSend, rinfo.port, rinfo.address);
  } catch (e) {
    console.log(`Error receiving data: ${e}`);
  }
});

udpSocket.on("error", (err) => {
  console.log(`Error: ${err}`);
});

udpSocket.on("listening", () => {
  const address = udpSocket.address();
  console.log(`Server listening ${address.address}:${address.port}`);
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