import { config } from "dotenv";
import { CeloAlfajoresTestnet } from "@thirdweb-dev/chains";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import {
  SmartWallet,
  SmartWalletConfig,
  getUserOpReceipt,
} from "@thirdweb-dev/wallets";

config();

const PIMLICO_KEY = "YOUR_API_KEY";
const chain = CeloAlfajoresTestnet;
const factoryAddress = "0x8fb9023405Cc2fDa7C1BB3B963767D121cAa698A"; // AccountFactory
const bundlerUrl = `https://api.pimlico.io/v1/${chain.slug}/rpc?apikey=${PIMLICO_KEY}`;

const main = async () => {
  console.log("Running on", chain.slug, "with factory", factoryAddress);

  // ---- Connecting to a Smart Wallet ----

  // Load or create personal wallet
  // here we generate LocalWallet that will be stored in wallet.json
  const adminWallet = new LocalWalletNode();
  await adminWallet.loadOrCreate({
    strategy: "encryptedJson",
    password: "password",
  });
  const adminWalletAddress = await adminWallet.getAddress();
  console.log("Admin wallet address:", adminWalletAddress);

  // Configure the smart wallet
  const config: SmartWalletConfig = {
    chain,
    factoryAddress,
    secretKey: "",
    gasless: true,
    bundlerUrl: bundlerUrl,
    paymasterUrl: bundlerUrl,
  };

  // Connect the smart wallet
  const smartWallet = new SmartWallet(config);
  await smartWallet.connect({
    personalWallet: adminWallet,
  });

  console.log("Smart wallet address:", await smartWallet.getAddress());

  // this never resolves on Celo, but works on other chains
  console.log("Deploying...");
  // Fake transaction to deploy the smart wallet
  const sentTx = await smartWallet.sendRaw({
    to: adminWalletAddress,
    data: "0x",
  });
  const userOpHash = sentTx.hash;
  console.log("Waiting for userOp with Hash", userOpHash);
  const txHash = await getUserOpReceipt(chain, userOpHash);
  if (!txHash) {
    console.log("No txHash found");
    return;
  }
  console.log("Deployed with transactionHash", txHash);
};

main();
