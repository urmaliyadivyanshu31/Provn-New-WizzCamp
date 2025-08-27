// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Script, console} from "forge-std/Script.sol";
import {ProvnMarketplace} from "../src/ProvnMarketplace.sol";

contract DeployUpdatedMarketplace is Script {
    // BaseCAMP testnet contract addresses
    address constant IP_NFT_CONTRACT = 0x5a3f832b47b948dA27aE788E96A0CD7BB0dCd1c1;
    address constant CAMP_TOKEN_CONTRACT = 0x618a32EAe7deE87Dd7DF8dF24d18dc98FB6DF8ab;
    address constant TREASURY_ADDRESS = 0x592544471e26B60edfa018B03e9adE320fD81095; // Current marketplace as treasury for now

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