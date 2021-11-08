window.store = {};

function setLoading(loading) {
    if (loading) {
        document.getElementById('textbox').classList.add('hidden');
        document.getElementById('table').classList.add('hidden');
        document.getElementById('loading').classList.remove('hidden');
    } else {
        document.getElementById('inputDiv').classList.remove('hidden');
        document.getElementById('loading').classList.add('hidden');
    }
}

function setResult(result) {
    const textbox = document.getElementById('textbox');

    if (result.idx) {
        textbox.innerText = 'This airdrop has been claimed on ' + (new Date(result.timestamp*1000)).toLocaleString() + '.';
        textbox.classList.remove('bg-green-200');
        textbox.classList.add('bg-blue-200');

        // Table
        document.getElementById('block').innerText = result.block;
        document.getElementById('block').href = 'https://hnsnetwork.com/blocks/' + result.block;
        document.getElementById('txhash').innerText = result.txid;
        document.getElementById('txhash').href = 'https://hnsnetwork.com/txs/' + result.txid;
        document.getElementById('amount').innerText = result.value / 1e6 + ' HNS';
        document.getElementById('address').innerText = result.address;
        document.getElementById('address').href = 'https://hnsnetwork.com/address/' + result.address;
        document.getElementById('table').classList.remove('hidden');
    } else {
        textbox.innerText = 'This airdrop has not yet been claimed!';
        textbox.classList.remove('bg-blue-200');
        textbox.classList.add('bg-green-200');
    }
    textbox.classList.remove('hidden');
}

function checkIndex() {
    setLoading(true);
    const indexText = document.getElementById('indexInput').value;

    let index;
    try {
        index = parseInt(indexText);
        if (!Number.isInteger(index)) throw new Error('Not a valid index.');
    } catch (error) {
        console.error(error);
        setLoading(false);
        alert(error);
        return;
    }

    const stmt = window.store.db.prepare("SELECT * FROM airdrops WHERE idx=:idx");
    const result = stmt.getAsObject({':idx' : index});
    console.log(result);

    setResult(result);
    setLoading(false);
}

(async () => {
    const sqlPromise = initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/sql-wasm.wasm`
    });
    const dataPromise = fetch("https://siasky.net/fAetFUuTmXTjpTVsTBl8ZTZgkIRDxlWEkTeauIKLo5zNsQ").then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
    const db = new SQL.Database(new Uint8Array(buf));
    window.store.db = db;
    console.log(db);

    setLoading(false);

    document.getElementById('checkBtn').addEventListener('click', checkIndex)
})();
