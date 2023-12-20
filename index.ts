import { config } from "dotenv";
import { CeloAlfajoresTestnet, Polygon } from "@thirdweb-dev/chains";
import { LocalWalletNode } from "@thirdweb-dev/wallets/evm/wallets/local-wallet-node";
import {
  SmartWallet,
  SmartWalletConfig,
  getUserOpReceipt,
} from "@thirdweb-dev/wallets";

config();

const PIMLICO_KEY = "YOUR_API_KEY";
const chain = Polygon;

const factoryAddressese = {
  [CeloAlfajoresTestnet.chainId]: "0x8fb9023405Cc2fDa7C1BB3B963767D121cAa698A",
  [Polygon.chainId]: "0x26ac92e1a4d98e8cc9266416e512c6e2ec1dc792",
};
const factoryAddress = factoryAddressese[chain.chainId];
const bundlerUrl = `https://api.pimlico.io/v1/${chain.slug}/rpc?apikey=${PIMLICO_KEY}`;

const celoTest = async (
  smartWallet: SmartWallet,
  adminWalletAddress: string
) => {
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

const polygonTest = async (
  smartWallet: SmartWallet,
  adminWalletAddress: string
) => {
  const estimate = await smartWallet.estimateRaw({
    to: adminWalletAddress,
    data: "0x",
  });
  console.log(
    "CallGasLimit estimated",
    estimate.details.transactionGasLimit.toString()
  );
  if (estimate.details.transactionGasLimit.eq(9000)) {
    console.log(
      "CallGasLimit returned was 9000!! it shouldnt be 9000!! should be at least 21k"
    );
  }
};

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

  switch (chain.chainId as number) {
    case CeloAlfajoresTestnet.chainId:
      await celoTest(smartWallet, adminWalletAddress);
      break;
    case Polygon.chainId:
      await polygonTest(smartWallet, adminWalletAddress);
      break;
  }
};

main();
