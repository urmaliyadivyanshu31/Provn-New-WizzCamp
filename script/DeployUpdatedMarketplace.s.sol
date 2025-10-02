// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Script, console} from "forge-std/Script.sol";
import {ProvnMarketplace} from "../src/ProvnMarketplace.sol";

contract DeployUpdatedMarketplace is Script {
    // BaseCAMP testnet contract addresses (VERIFIED ON-CHAIN)
    address constant IP_NFT_CONTRACT = 0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1; // Origin Protocol IP-NFT (correct)
    address constant CAMP_TOKEN_CONTRACT = 0xa673B3E946A64037AdBAe22a0f56916dE43c678c; // PROVN Token (verified on-chain)
    address constant TREASURY_ADDRESS = 0x7669aB66996022A0d2fAFcdB1c4Dc20FB3dc1961; // Admin wallet as treasury (checksummed)

    function run() external {
        vm.startBroadcast();

        // Deploy the updated ProvnMarketplace contract
        ProvnMarketplace marketplace = new ProvnMarketplace(
            IP_NFT_CONTRACT,
            CAMP_TOKEN_CONTRACT,
            TREASURY_ADDRESS
        );

        console.log("Updated ProvnMarketplace deployed at:", address(marketplace));
        console.log("IP-NFT Contract:", IP_NFT_CONTRACT);
        console.log("CAMP Token:", CAMP_TOKEN_CONTRACT);
        console.log("Treasury:", TREASURY_ADDRESS);

        vm.stopBroadcast();
    }
}