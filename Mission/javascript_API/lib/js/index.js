let _DEFINE = {
  'mnemonic': 'ostrich negative arm visit stairs frame quiz doctor design brown dirt make',
  'coinIndex': 0xc8
}

let _SUBMIT = {
  utxo: [{
    txId: "f251cc63d713206293de1629079a89bc4f1cff6a54a74005a48f6c7bf3b0f0cd",
    vout: 1
  }],
  toAmountSatoshis: 0,
  valueData: "48656c6c6f20576f726c64210a",
  scriptPubKey: ""
}

let pinNum = false
//27135d37afbaddc71e9088a47e3e0ed7fc5d57086aeb727caffb95153caa775 c410a106619c60e7b2482c289a5b91c6d1875a176304c6509bc3e8cfd83dd5ece
/**
* Mnemonic 으로 부터 seedHex 복구
*/
let seedHex = function () {
  //return bip39.mnemonicToSeedHex(mnemonicList.toString('hex'));
  var seed = bip39.mnemonicToSeedHex(_DEFINE.mnemonic)
  //27135d37afbaddc71e9088a47e3e0ed7fc5d57086aeb727caffb95153caa775c410a106619c60e7b2482c289a5b91c6d1875a176304c6509bc3e8cfd83dd5ece

  return seed;
}

/**
*  주소 생성
*/


let createAddress = function () {
  let hdMaster = bitcoin.HDNode.fromSeedHex(seedHex(), networks.hdac);
  let node = hdMaster.deriveHardened(44).deriveHardened(_DEFINE.coinIndex).deriveHardened(0).derive(0).derive(0);
  _SUBMIT.scriptPubKey = node.keyPair.getPublicKey()

  return node.keyPair.getAddress();
}

/**
 *   create keypairs with password
 */

let createEncryptKeypairs = function (password) {
  pinNum = password === undefined ? false : password
  let randomNum = bitcoin.ECPair.makeRandomHex();
  let hdMaster = bitcoin.HDNode.fromSeedHex(randomNum, networks.hdac);
  let node = hdMaster.deriveHardened(44).deriveHardened(_DEFINE.coinIndex).deriveHardened(0).derive(0).derive(0);
  _SUBMIT.scriptPubKey = node.keyPair.getPublicKey();

  let keypairs = {
    compressedPubkey : node.keyPair.getPublicKeyBuffer().toString('hex'),
    uncompressedPubkey: node.keyPair.getPublicKeyBufferUnCompressed().toString('hex'),
    privatekey: node.keyPair.d.toHex()
  }

  console.log("Address : " + node.keyPair.getAddress())

  return keypairs
}

/**
 *   create keypairs without password
 */

let createKeypairs = function () {
  let randomNum = bitcoin.ECPair.makeRandomHex();
  let hdMaster = bitcoin.HDNode.fromSeedHex(randomNum, networks.hdac);
  let node = hdMaster.deriveHardened(44).deriveHardened(_DEFINE.coinIndex).deriveHardened(0).derive(0).derive(0);
  _SUBMIT.scriptPubKey = node.keyPair.getPublicKey();

  let keypairs = {
    compressedPubkey : node.keyPair.getPublicKey(),
    uncompressedPubkey: node.keyPair.getPublicKeyBufferUnCompressed().toString('hex'),
    privatekey: node.keyPair.d.toHex()
  }

  console.log("Address : " + node.keyPair.getAddress())

  return keypairs
}

/**
*  rawTx Hex 값 생성
*/
let rawTxHex = function (pin) {

  if (pinNum == false)
    return console.error("pin is not set")
  if (pinNum != pin)
    return console.error("pin is not corrected");
    

  let submit = _SUBMIT
  let txBuilder = new bitcoin.TransactionBuilder(networks.hdac);

  /**
  * 1. Input 추가
  */
  for (let i = 0; i < submit.utxo.length; i++) {
    txBuilder.addInput(submit.utxo[i].txId, submit.utxo[i].vout)
  }


  /**
  * 2. output data 추가 ( optional )
  *
  * 전송 data 가 string type 일 경우 내부에서 hex 로 변경
  */


  txBuilder.addOutputData(submit.toAmountSatoshis, submit.valueData)



  /**
  * 3. output 추가
  *
  * 보내는 주소 / 수량 parameter 로 전달
  */
  txBuilder.addOutput(submit.scriptPubKey, submit.toAmountSatoshis);
  // Input 에 사용된 utxo 의 나머지 금액 입력
  //txBuilder.addOutput(address, remain);





  /**
  * 4. Input 들에 대한 서명
  *
  * changeIndex, addressIndex : 사용된 utxo 의 주소에 대한 BIP44 derive Index 값
  */
  let hdMaster = bitcoin.HDNode.fromSeedHex(seedHex(), networks.hdac);
  let node = hdMaster.deriveHardened(44).deriveHardened(_DEFINE.coinIndex).deriveHardened(0);
  for (let i = 0; i < submit.utxo.length; i++) {
    let changeIndex = 0;
    let addressIndex = 0;
    let targetNode = node.derive(changeIndex).derive(addressIndex);
    txBuilder.sign(i, targetNode.keyPair);
  }


  /**
  * 5. build rawTx
  */

  var rawTx = txBuilder.build().toHex();
  console.log(rawTx)
  return rawTx
}

/*function setUTXO (txid) {
  _SUBMIT.utxo[0].txId = txid
  console.log(_SUBMIT.utxo[0].txId)
}*/

/*document.addEventListener("DOMContentLoaded", function(){
  createAddress()
  seedHex()
  rawTxHex(_SUBMIT)
  let pubkey = createKeyPairs().pubkey;
  let privkey = createKeyPairs().privkey;

  console.log("pubkey = " + pubkey)
  console.log("privkey = " + privkey)
})*/
