class Header {
    /**
    * Creates a Header instance.
    * @param {number} packetIdentifier - A unique identifier for the packet.
    * @param {number} queryOrResponseIndicator - Indicates if it's a query (1) or a response (0).
    * @param {number} operationCode - Specifies the operation code.
    * @param {number} authoritativeAnswer - Indicates if the server is authoritative (1) or not (0).
    * @param {number} truncation - Indicates if the message is truncated (1) or not (0).
    * @param {number} recursionDesired - Specifies if recursion is desired (1) or not (0).
    * @param {number} recursionAvailable - Specifies if recursion is available (1) or not (0).
    * @param {number} reserved - Reserved for future use.
    * @param {number} responseCode - Indicates the response code.
    * @param {number} questionCount - The number of questions in the message.
    * @param {number} answerRecordCount - The number of answers in the message.
    * @param {number} authorityRecordCount - The number of authority records in the message.
    * @param {number} additionalRecordCount - The number of additional records in the message.
    */
    constructor(
      packetIdentifier,
      queryOrResponseIndicator,
      operationCode,
      authoritativeAnswer,
      truncation,
      recursionDesired,
      recursionAvailable,
      reserved,
      responseCode,
      questionCount,
      answerRecordCount,
      authorityRecordCount,
      additionalRecordCount
    ) {
      this.packetIdentifier = packetIdentifier;
      this.queryOrResponseIndicator = queryOrResponseIndicator;
      this.operationCode = operationCode;
      this.authoritativeAnswer = authoritativeAnswer;
      this.truncation = truncation;
      this.recursionDesired = recursionDesired;
      this.recursionAvailable = recursionAvailable;
      this.reserved = reserved;
      this.responseCode = responseCode;
      this.questionCount = questionCount;
      this.answerRecordCount = answerRecordCount;
      this.authorityRecordCount = authorityRecordCount;
      this.additionalRecordCount = additionalRecordCount;
    }
  
    // Method to represent the object as a string
    toString() {
      return JSON.stringify(this, null, 2);
    }
  
    // Static method to create a Header from a plain object
    static fromObject(obj) {
      return new Header(
        obj.packetIdentifier,
        obj.queryOrResponseIndicator,
        obj.operationCode,
        obj.authoritativeAnswer,
        obj.truncation,
        obj.recursionDesired,
        obj.recursionAvailable,
        obj.reserved,
        obj.responseCode,
        obj.questionCount,
        obj.answerRecordCount,
        obj.authorityRecordCount,
        obj.additionalRecordCount
      );
    }

    toBuffer() {
        const buffer = Buffer.alloc(12)
        buffer.writeUInt16BE(this.packetIdentifier, 0)
        const thirdByte = (this.queryOrResponseIndicator << 7) 
            + (this.operationCode << 3)
            + (this.authoritativeAnswer << 2)
            + (this.truncation << 1)
            + (this.recursionDesired)
        buffer.writeUInt8(thirdByte, 2)
        const fourthByte = (this.recursionAvailable << 7) 
            + (this.reserved << 4)
            + (this.responseCode)
        buffer.writeUInt8(fourthByte, 3)
        buffer.writeUInt16BE(this.questionCount, 4)
        buffer.writeUInt16BE(this.answerRecordCount, 6)
        buffer.writeUInt16BE(this.authorityRecordCount, 8)
        buffer.writeUInt16BE(this.additionalRecordCount, 10)
        return buffer;
    }
}

class HeaderBuilder {

    constructor() {
        this.packetIdentifier = 1234;
        this.queryOrResponseIndicator = 1;
        this.operationCode = 0;
        this.authoritativeAnswer = 0;
        this.truncation = 0;
        this.recursionDesired = 0;
        this.recursionAvailable = 0;
        this.reserved = 0;
        this.responseCode = 0;
        this.questionCount = 0;
        this.answerRecordCount = 0;
        this.authorityRecordCount = 0;
        this.additionalRecordCount = 0;
  }

  setPacketIdentifier(value) {
    this.packetIdentifier = value;
    return this;
  }

  setQueryOrResponseIndicator(value) {
    this.queryOrResponseIndicator = value;
    return this;
  }

  setOperationCode(value) {
    this.operationCode = value;
    return this;
  }

  setAuthoritativeAnswer(value) {
    this.authoritativeAnswer = value;
    return this;
  }

  setTruncation(value) {
    this.truncation = value;
    return this;
  }

  setRecursionDesired(value) {
    this.recursionDesired = value;
    return this;
  }

  setRecursionAvailable(value) {
    this.recursionAvailable = value;
    return this;
  }

  setReserved(value) {
    this.reserved = value;
    return this;
  }

  setResponseCode(value) {
    this.responseCode = value;
    return this;
  }

  setQuestionCount(value) {
    this.questionCount = value;
    return this;
  }

  setAnswerRecordCount(value) {
    this.answerRecordCount = value;
    return this;
  }

  setAuthorityRecordCount(value) {
    this.authorityRecordCount = value;
    return this;
  }

  setAdditionalRecordCount(value) {
    this.additionalRecordCount = value;
    return this;
  }

  build() {
    return new Header(
      this.packetIdentifier,
      this.queryOrResponseIndicator,
      this.operationCode,
      this.authoritativeAnswer,
      this.truncation,
      this.recursionDesired,
      this.recursionAvailable,
      this.reserved,
      this.responseCode,
      this.questionCount,
      this.answerRecordCount,
      this.authorityRecordCount,
      this.additionalRecordCount
    );
  }
}

export { Header, HeaderBuilder };
