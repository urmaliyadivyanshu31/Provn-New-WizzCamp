import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CAMP_TOKEN_ADDRESS = "0x618a32eae7dEE87dD7dF8DF24D18dc98fb6Df8Ab"; // CAMP token on Base Camp Network
const IP_NFT_CONTRACT = "0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1"; // Existing IP-NFT contract
const TREASURY_ADDRESS = "0xBe611BFBDcb45C5E8C3E81a3ec36CBee31E52981"; // Treasury address

const ProvnMarketplaceModule = buildModule("ProvnMarketplace", (m) => {
  const ipToken = m.getParameter("ipToken", IP_NFT_CONTRACT);
  const campToken = m.getParameter("campToken", CAMP_TOKEN_ADDRESS);
  const treasury = m.getParameter("treasury", TREASURY_ADDRESS);

  const provnMarketplace = m.contract("ProvnMarketplace", [
    ipToken,
    campToken,
    treasury
  ]);

  return { provnMarketplace };
});

export default ProvnMarketplaceModule;