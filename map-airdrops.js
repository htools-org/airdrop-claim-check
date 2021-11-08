'use strict';

const sqlite3 = require('sqlite3').verbose();
const AirdropProof = require('hsd/lib/primitives/airdropproof');
const { NodeClient } = require('hs-client');

// const START_HEIGHT = 2016;
// const END_HEIGHT = 2116;

const START_HEIGHT = 2016;
const END_HEIGHT = 93225;

const nodeOptions = {
  port: 12037,
  apiKey: 'api-key',
};

const nodeClient = new NodeClient(nodeOptions);

// Connect to Database and set up
// const db = new sqlite3.Database(':memory:');
const db = new sqlite3.Database('./airdrops.sqlite3');
db.serialize(function () {
  db.run(
    'CREATE TABLE IF NOT EXISTS airdrops (idx INTEGER, subidx INTEGER, type INTEGER, timestamp INTEGER, address TEXT, value INTEGER, block INTEGER, txid TEXT)'
  );
});

let foundProofs = 0;

(async () => {
  console.log(
    `[*] Searching for airdrop proofs from block ${START_HEIGHT} to ${END_HEIGHT}.`
  );

  for (let height = START_HEIGHT; height <= END_HEIGHT; height++) {
    console.log(`[${foundProofs}/217557] Processing block #${height}...`);

    const block = await nodeClient.execute('getblockbyheight', [height]);
    // console.log(block);

    const cbTx = await nodeClient.getTX(block.tx[0]);
    // console.log(cbTx);

    if (cbTx.inputs.length === 1) continue;

    for (const [inpIdx, input] of cbTx.inputs.entries()) {
      // console.log(inpIdx, input);

      const witness = input.witness?.[0];
      if (witness?.length < 50) continue;
      // console.log(witness);

      try {
        // Decode airdrop proof
        let proof;
        try {
          proof = AirdropProof.decode(Buffer.from(witness, 'hex'));
          if (!proof) continue;
        } catch (error) {
          console.log('Not an airdrop proof, moving on.');
          continue;
        }

        const key = proof.getKey();
        const value = proof.getValue();

        console.log(
          `Found proof for index ${proof.index} subindex ${proof.subindex}.`
        );
        foundProofs += 1;

        // Save to Database
        const airdropSQLStatement = db.prepare(
          'INSERT INTO airdrops VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        airdropSQLStatement.run(
          proof.index,
          proof.subindex,
          key.type,
          block.time,
          cbTx.outputs[inpIdx].address,
          value,
          height,
          block.tx[0]
        );
        airdropSQLStatement.finalize();
      } catch (error) {
        console.error(error);
        console.log(proof);
        console.log(key);
        throw error;
      }
    }
  }

  // db.all('SELECT * from airdrops', (err, rows) => {
  //   console.log(err);
  //   console.log(rows);
  // });

  db.close();
  console.log('done.');
})();
