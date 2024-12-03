class Answer {
    /**
    * Creates a Answer instance.
    * @param {string} name - A domain name.
    * @param {number} type - The type of record.
    * @param {string} ip 
    */
    constructor(
        name,
        type,
        ip
    ) {
        this.name = name;
        this.type = type;
        this.answerClass = 1
        this.timeToLive = 60
        this.dataLength = 4
        this.ip = ip
    }

    // Method to represent the object as a string
    toString = () => {
        return JSON.stringify(this, null, 2);
    }

    toBuffer = () => {
        const labels = this.name.split(".").map(l => {
            return {
                len: l.length, 
                label: l
            }})
        const size = labels.reduce((acc, cur) => acc + cur.len + 1, 0)
        const buffer = Buffer.alloc(size + 1 + 2 + 2 + 4 + 2 + 4)
        let offset = 0;
        for (const {label, len} of labels) {
            buffer.writeUInt8(len, offset)
            offset++
            buffer.write(label, offset)
            offset += len
        }
        buffer.writeUInt8(0, offset++)
        buffer.writeUInt16BE(this.type, offset)
        buffer.writeUInt16BE(this.answerClass, offset + 2)
        buffer.writeUInt32BE(this.timeToLive, offset + 4)
        buffer.writeUInt16BE(this.dataLength, offset + 8)
        offset += 10
        const ipSplit = this.ip.split(".", 4).map(s => parseInt(s));
        for (const n of ipSplit) {
            buffer.writeUInt8(n, offset)
            offset++;
        }
        return buffer;
    }
}


/* 

    Name 	\x0ccodecrafters\x02io followed by a null byte (that's codecrafters.io encoded as a label sequence)
    Type 	1 encoded as a 2-byte big-endian int (corresponding to the "A" record type)
    Class 	1 encoded as a 2-byte big-endian int (corresponding to the "IN" record class)
    TTL 	Any value, encoded as a 4-byte big-endian int. For example: 60.
    Length 	4, encoded as a 2-byte big-endian int (corresponds to the length of the RDATA field)
    Data 	Any IP address, encoded as a 4-byte big-endian int. For example: \x08\x08\x08\x08 (that's 8.8.8.8 encoded as a 4-byte integer)
*/

export { Answer };