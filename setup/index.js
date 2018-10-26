const Web3 = require('web3');
const namehash = require('eth-ens-namehash');

const web3 = new Web3("http://ganache:8545");
const gas = 4000000;

function pause(duration) {
    return new Promise((res) => setTimeout(res, duration * 1000));
}

function backoff(retries, func, delay = 0.5, multiplier = 2) {
    return func().catch((err) =>
        retries > 1 ?
            pause(delay).then(() => backoff(retries - 1, func, delay * multiplier, multiplier)) :
            Promise.reject(err)
    );
}

function setup(){
    return backoff(10, web3.eth.net.getId, 3, 1)
        .then((id) => {
            networkId = id;
            return web3.eth.getAccounts();
        }) 
        .then(run);
}

async function run(accounts) {
    const owner = web3.utils.toChecksumAddress(accounts[0]);
    const squatter = web3.utils.toChecksumAddress(accounts[1]);

    const ENSContractABI= [{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"resolver","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"label","type":"bytes32"},{"name":"owner","type":"address"}],"name":"setSubnodeOwner","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"ttl","type":"uint64"}],"name":"setTTL","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"node","type":"bytes32"}],"name":"ttl","outputs":[{"name":"","type":"uint64"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"resolver","type":"address"}],"name":"setResolver","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"node","type":"bytes32"},{"name":"owner","type":"address"}],"name":"setOwner","outputs":[],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":false,"name":"owner","type":"address"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":true,"name":"label","type":"bytes32"},{"indexed":false,"name":"owner","type":"address"}],"name":"NewOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":false,"name":"resolver","type":"address"}],"name":"NewResolver","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"node","type":"bytes32"},{"indexed":false,"name":"ttl","type":"uint64"}],"name":"NewTTL","type":"event"}];
    const FIFSRegistrarContractABI = [{"constant":false,"inputs":[{"name":"subnode","type":"bytes32"},{"name":"owner","type":"address"}],"name":"register","outputs":[],"payable":false,"type":"function"},{"inputs":[{"name":"ensAddr","type":"address"},{"name":"node","type":"bytes32"}, {"name": "_startDate", "type": "uint256"}],"type":"constructor"}];

    const ENSRegistryByteCode = '0x33600060000155610220806100146000396000f3630178b8bf60e060020a600035041415610023576020600435015460405260206040f35b6302571be360e060020a600035041415610047576000600435015460405260206040f35b6316a25cbd60e060020a60003504141561006b576040600435015460405260206040f35b635b0fc9c360e060020a6000350414156100b8576000600435015433141515610092576002565b6024356000600435015560243560405260043560198061020760003960002060206040a2005b6306ab592360e060020a6000350414156101165760006004350154331415156100df576002565b6044356000600435600052602435602052604060002001556044356040526024356004356021806101e660003960002060206040a3005b631896f70a60e060020a60003504141561016357600060043501543314151561013d576002565b60243560206004350155602435604052600435601c806101ca60003960002060206040a2005b6314ab903860e060020a6000350414156101b057600060043501543314151561018a576002565b602435604060043501556024356040526004356016806101b460003960002060206040a2005b6002564e657754544c28627974657333322c75696e743634294e65775265736f6c76657228627974657333322c61646472657373294e65774f776e657228627974657333322c627974657333322c61646472657373295472616e7366657228627974657333322c6164647265737329';
    const FIFSRegistrarByteCode = '0x60606040818152806101c4833960a0905251608051600080546c0100000000000000000000000080850204600160a060020a0319909116179055600181905550506101768061004e6000396000f3606060405260e060020a6000350463d22057a9811461001e575b610002565b34610002576100f4600435602435600154604080519182526020808301859052815192839003820183206000805494830181905283517f02571be3000000000000000000000000000000000000000000000000000000008152600481018390529351879592949193600160a060020a03909316926302571be3926024808201939182900301818787803b156100025760325a03f11561000257505060405151915050600160a060020a038116158015906100ea575033600160a060020a031681600160a060020a031614155b156100f657610002565b005b60008054600154604080517f06ab5923000000000000000000000000000000000000000000000000000000008152600481019290925260248201899052600160a060020a03888116604484015290519216926306ab59239260648084019382900301818387803b156100025760325a03f11561000257505050505050505056';

    const zero = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const ens = await new web3.eth.Contract(ENSContractABI)
        .deploy({data:ENSRegistryByteCode})
        .send({from: owner, gas});

    const registrar = await new web3.eth.Contract(FIFSRegistrarContractABI)
        .deploy({data:FIFSRegistrarByteCode, arguments:[ens.options.address, namehash.hash('geo'), zero]})
        .send({from:owner, gas});

    await ens.methods.setSubnodeOwner(zero, web3.utils.sha3('geo'), registrar.options.address).send({from: owner, gas});
    await registrar.methods.register(web3.utils.sha3('myname'), squatter).send({from: squatter, gas});

    const registeredOwner = await ens.methods.owner(namehash.hash('myname.geo')).call();
    console.log('registered owner of myname: ', registeredOwner);
}

setup()
    .then(console.log)
    .catch(console.error);
