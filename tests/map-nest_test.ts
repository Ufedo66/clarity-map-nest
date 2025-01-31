import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Test adding new location",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet_1 = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("map-nest", "add-location", [
        types.utf8("Coffee Shop"),
        types.utf8("Great local coffee spot"),
        types.utf8("Food & Drink"),
        types.int(40),
        types.int(-73)
      ], wallet_1.address)
    ]);
    
    assertEquals(block.receipts.length, 1);
    assertEquals(block.height, 2);
    assertEquals(block.receipts[0].result, "(ok u1)");
  },
});

Clarinet.test({
  name: "Test adding review and token reward",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("map-nest", "add-location", [
        types.utf8("Pizza Place"),
        types.utf8("Amazing NY style pizza"),
        types.utf8("Food & Drink"), 
        types.int(40),
        types.int(-73)
      ], wallet_1.address),
      
      Tx.contractCall("map-nest", "add-review", [
        types.uint(1),
        types.uint(5),
        types.utf8("Great spot!")
      ], wallet_2.address)
    ]);

    assertEquals(block.receipts.length, 2);
    assertEquals(block.receipts[1].result, "(ok true)");
  },
});

Clarinet.test({
  name: "Test location verification - owner only",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet_1 = accounts.get("wallet_1")!;
    
    let block = chain.mineBlock([
      Tx.contractCall("map-nest", "add-location", [
        types.utf8("Museum"),
        types.utf8("Local history museum"),
        types.utf8("Culture"),
        types.int(40),
        types.int(-73)
      ], wallet_1.address),
      
      Tx.contractCall("map-nest", "verify-location", [
        types.uint(1)
      ], deployer.address),
      
      Tx.contractCall("map-nest", "verify-location", [
        types.uint(1)  
      ], wallet_1.address)
    ]);

    assertEquals(block.receipts[1].result, "(ok true)");
    assertEquals(block.receipts[2].result, "(err u103)");
  },
});
