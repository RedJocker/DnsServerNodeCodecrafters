import { Answer } from "./answer.js";

class Question {
    /**
    * Creates a Question instance.
    * @param {string} name - A domain name.
    * @param {number} type - The type of record.
    */
    constructor(
        name,
        type,
    ) {
        this.name = name;
        this.type = type;
        this.questionClass = 1;  
    }

    // Method to represent the object as a string
    toString() {
        return JSON.stringify(this, null, 2);
    }

    toBuffer = () => {
        const labels = this.name.split(".").map(l => {
            return {
                len: l.length, 
                label: l
            }})
        const size = labels.reduce((acc, cur) => acc + cur.len + 1, 0)
        const buffer = Buffer.alloc(size + 1 + 4)
        let offset = 0;
        for (const {label, len} of labels) {
            buffer.writeUInt8(len, offset)
            offset++
            buffer.write(label, offset)
            offset += len
        }
        buffer.writeInt8(0, offset++)
        buffer.writeInt16BE(this.type, offset)
        buffer.writeInt16BE(this.questionClass, offset + 2)
        return buffer;
    }

    /**
    * Parse a buffer, starting at offset, into a Question instance.
    * @param {Buffer} buffer - A buffer.
    * @param {number} offset - Where to start reading buffer to create Question instance.
    * @returns {{question: Question, len: number}} - An object containig key question with the question that was
    *  parsed from buffer and len the size that was read, so that it can be added to offset if needed 
    */
    static fromBuffer(buffer, offset) {
        let len = 0;
        let size = buffer.readUInt8(offset++)
        len += size + 1;
        let labels = []
        while (size > 0) {
            const label = buffer.subarray(offset, offset + size).toString("ascii")
            labels.push(label)
            offset += size;
            size = buffer.readUInt8(offset++)
            len += size + 1
        }
        const name = labels.join('.')
        const type = buffer.readInt16BE(offset)
        const questionClass = buffer.readInt16BE(offset + 2) 
        len += 4
        const question = new Question(name, type)
        return {question, len}
      }

      toAnswer = () => {
        return new Answer(this.name, this.type, this.domainToIp(this.name))
      }

      domainToIp = (name) => "8.8.8.8"
      
}


/* 

    Name: A domain name, represented as a sequence of "labels" (more on this below)
    Type: 2-byte int; the type of record (1 for an A record, 5 for a CNAME record etc., full list here)
    Class: 2-byte int; usually set to 1 (full list here)
*/

export { Question };