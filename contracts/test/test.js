const Web3 = require('web3');
const namehash = require('eth-ens-namehash');
const {deployContract} = require('./utils');

const web3 = new Web3();
web3.setProvider(global.web3.currentProvider);

const gas = 4000000;

const zero = '0x0000000000000000000000000000000000000000000000000000000000000000';

contract('ENS', (accounts) => {

    let ens;
    let registrar;
    let publicResolver;
    let markerResolver;

    const owner = web3.utils.toChecksumAddress(accounts[0]);
    const squatter = web3.utils.toChecksumAddress(accounts[1]);

    beforeEach(async () =>{
        ens = await deployContract('ENSRegistry');
    });
    
    
    it('can register a root domain', async() => {
        const registrar = await deployContract('FIFSRegistrar', ens.options.address, zero);
        await ens.methods.setOwner(zero, registrar.options.address).send({from: owner, gas});

        await registrar.methods.register(web3.utils.sha3('myname'), squatter).send({from: squatter, gas});
        const registeredOwner = await ens.methods.owner(namehash.hash('myname')).call();
        assert.equal(registeredOwner, squatter);
    })

    it('can register a sub domain', async() => {
        const rootDomain = 'geo';
        const domainToOwn = ['myname', rootDomain];
        
        const registrar = await deployContract('FIFSRegistrar', ens.options.address, namehash.hash(rootDomain));

        await ens.methods.setSubnodeOwner(zero, web3.utils.sha3(rootDomain), registrar.options.address).send({from: owner, gas});
        await registrar.methods.register(web3.utils.sha3(domainToOwn[0]), squatter).send({from: squatter, gas});
        
        const registeredOwner = await ens.methods.owner(namehash.hash(domainToOwn.join('.'))).call();
        assert.equal(registeredOwner, squatter);
    });

    it('can create a resolver and ask for a name', async() => {
        const rootDomain = 'geo';
        const domainToOwn = ['myname', rootDomain];
        
        const registrar = await deployContract('FIFSRegistrar', ens.options.address, namehash.hash(rootDomain));

        await ens.methods.setSubnodeOwner(zero, web3.utils.sha3(rootDomain), registrar.options.address).send({from: owner, gas});
        await registrar.methods.register(web3.utils.sha3(domainToOwn[0]), squatter).send({from: squatter, gas});
        
        const node = namehash.hash(domainToOwn.join('.'));

        const registeredOwner = await ens.methods.owner(node).call();
        assert.equal(registeredOwner, squatter);

        const publicResolver = await deployContract('PublicResolver', ens.options.address);
        await publicResolver.methods.setName(node, 'hello').send({from:squatter, gas});
        const nameRegistered = await publicResolver.methods.name(node).call();

        assert.equal(nameRegistered, 'hello');
    })

    it('can create a MarkerResolver and ask for a text', async() => {
        const rootDomain = 'geo';
        const domainToOwn = ['myname', rootDomain];
        
        const registrar = await deployContract('FIFSRegistrar', ens.options.address, namehash.hash(rootDomain));

        await ens.methods.setSubnodeOwner(zero, web3.utils.sha3(rootDomain), registrar.options.address).send({from: owner, gas});
        await registrar.methods.register(web3.utils.sha3(domainToOwn[0]), squatter).send({from: squatter, gas});
        
        const node = namehash.hash(domainToOwn.join('.'));

        const registeredOwner = await ens.methods.owner(node).call();
        assert.equal(registeredOwner, squatter);

        const ad = 'coffee for 1 DAI!';
        const markerResolver = await deployContract('MarkerResolver', ens.options.address);
        await markerResolver.methods.setText(node, 'ad', ad).send({from:squatter, gas, value: 10000000000000000});
        const adRegistered = await markerResolver.methods.text(node, 'ad').call();

        assert.equal(adRegistered, ad);
    })
});