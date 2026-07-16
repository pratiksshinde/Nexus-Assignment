const csvParser = require("csv-parser");
const { Readable } = require("stream");
const { normalizeHeader } = require("./contactUtils");

function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];

    const stream = Readable.from(buffer);

    stream
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => normalizeHeader(header),
          skipLines: 0,
        })
      )
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

module.exports = parseCsvBuffer;