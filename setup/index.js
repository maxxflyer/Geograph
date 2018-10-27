const Web3 = require('web3');

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');

function getContractInfos(contractInfosFolder, networkId) {
    const contractInfos = {};
    fs.readdirSync(contractInfosFolder).forEach(file => {
        const contractInfo = JSON.parse(fs.readFileSync(path.join(contractInfosFolder,file)).toString());
        const networkKeys = Object.keys(contractInfo.networks);
        if(!networkId) {
            if(networkKeys && networkKeys.length > 0) {
                networkId = networkKeys[0];
                console.log('no networkId specified, using networkId', networkId, 'from ', JSON.stringify(contractInfo.networks));
            } else {
                console.error('no networkId specified, and can\'t find one');
            }
        }
        if (networkId && contractInfo.networks[networkId]){
            const currentNetwork = contractInfo.networks[networkId];
            contractInfo.networks = {}; // remove other networks info // TODO not sure why they are there ?
            contractInfo.networks[networkId] = currentNetwork;
            contractInfos[contractInfo.contractName] = contractInfo;
        }
    })

    return {networkId, contractInfos};
}

function deployContracts(truffleNetwork, networkId) {
    console.log('deploying contracts to network ' + networkId);
    return new Promise((resolve, reject) => {
        var child = childProcess.exec('yarn truffle migrate --reset --network ' + truffleNetwork, {
            cwd: './contracts'
        })
        child.stdout.pipe(process.stdout)
        child.on('exit', function() {
            //TODO use truffle folder as above OR tmp_deployments OR deployments
            // const contractInfosFolder = '../contracts/build/contracts';
            // + '/' + 'tmp_deployments'
            // fs.rmdirSync(contractInfosFolder);
            resolve(getContractInfos('./contracts/build/contracts', networkId));
        })
    });
}

const args = process.argv;
const nodeUrl = args[2] || "http://localhost:8545";

console.log('USING NODE AT : ' + nodeUrl);

const web3 = new Web3(nodeUrl);
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

let accounts;
let networkId;

function setup(){
    return backoff(10, web3.eth.net.getId, 3, 1)
        .then((id) => {
            networkId = id;
            return web3.eth.getAccounts();
        })
        .then((acc) => {accounts = acc})
        .then(() => deployContracts('ganache', networkId))
        .then(run);
}

async function run({networkId, contractInfos}) {
    const contracts = {};
    for(const contractInfoName of Object.keys(contractInfos)) {
        const ContractInfo = contractInfos[contractInfoName];
        console.log('CONTRACT ' + contractInfoName + ' DEPLOYED AT : ' + ContractInfo.networks[networkId].address);
        contracts[contractInfoName] = new web3.eth.Contract(ContractInfo.abi, ContractInfo.networks[networkId].address);
    }

    // const domainToOwn = ['myname', rootDomain];
    // await ens.methods.setSubnodeOwner(zero, web3.utils.sha3(rootDomain), registrar.options.address).send({from: owner, gas});
    // await registrar.methods.register(web3.utils.sha3(domainToOwn[0]), squatter).send({from: squatter, gas});

    // const registeredOwner = await ens.methods.owner(namehash.hash(domainToOwn.join('.'))).call();
    // console.log('registered owner of : ' + domainToOwn.join('.'), registeredOwner);

    // await ens.methods.setResolver(namehash.hash('myname.geo'), publicResolver.options.address).send({from: squatter});
}

setup()
    .then(console.log)
    .catch(console.error);
