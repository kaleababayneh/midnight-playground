// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Provides types and utilities for working with bulletin board contracts.
 *
 * @packageDocumentation
 */

import contractModule from '../../contract/src/managed/bboard/contract/index.cjs';
const { Contract, ledger, pureCircuits } = contractModule;
// import { Contract, ledger, pureCircuits } from '../../contract/src/index';

import { type ContractAddress, convert_bigint_to_Uint8Array } from '@midnight-ntwrk/compact-runtime';
import { type Logger } from 'pino';
import {
  type BBoardDerivedState,
  type BBoardContract,
  type BBoardProviders,
  type DeployedBBoardContract,
  bboardPrivateStateKey,
} from './common-types.js';
// import { Contract, ledger, pureCircuits, State } from '../../contract/src/managed/bboard/contract/index.cjs';
import { type BBoardPrivateState, createBBoardPrivateState, witnesses } from '../../contract/src/index';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';

/** @internal */
const bboardContractInstance: BBoardContract = new Contract(witnesses);

/**
 * Generic API for any deployed contract - works dynamically with any contract structure
 */
export class BBoardAPI {
  /** @internal */
  private constructor(
    public readonly deployedContract: DeployedBBoardContract,
    providers: BBoardProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    
    // Create a simple observable for the ledger state without hardcoded structure
    this.state$ = providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
      map((contractState) => ledger(contractState.data)),
      tap((ledgerState) =>
        logger?.trace({
          ledgerStateChanged: {
            ledgerState: ledgerState,
          },
        }),
      ),
      map((ledgerState) => {
        // Return the ledger state as-is for dynamic handling
        return ledgerState as any;
      }),
    );
  }

  /**
   * Gets the address of the current deployed contract.
   */
  readonly deployedContractAddress: ContractAddress;

  /**
   * Gets an observable stream of state changes based on the current public (ledger),
   * and private state data.
   */
  readonly state$: Observable<BBoardDerivedState>;

  /**
   * Generic method to call any circuit function dynamically
   *
   * @param functionName The name of the circuit function to call
   * @param args Arguments to pass to the function
   */
  async callCircuitFunction(functionName: string, ...args: any[]): Promise<void> {
    this.logger?.info(`Calling circuit function: ${functionName}`);

    try {
      // Check if the function exists on the contract
      const contractInterface = this.deployedContract.callTx as any;
      if (contractInterface[functionName] && typeof contractInterface[functionName] === 'function') {
        const txData = await contractInterface[functionName](...args);
        
        this.logger?.trace({
          transactionAdded: {
            circuit: functionName,
            txHash: txData.public.txHash,
            blockHeight: txData.public.blockHeight,
          },
        });
      } else {
        throw new Error(`Circuit function ${functionName} not found on contract`);
      }
    } catch (error) {
      this.logger?.error(`Failed to call circuit function ${functionName}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // Legacy methods for backward compatibility (commented out since contract changed)
  /*
  async post(message: string): Promise<void> {
    return this.callCircuitFunction('post', message);
  }

  async takeDown(): Promise<void> {
    return this.callCircuitFunction('takeDown');
  }
  */

  /**
   * Deploys a new bulletin board contract to the network.
   *
   * @param providers The bulletin board providers.
   * @param logger An optional 'pino' logger to use for logging.
   * @returns A `Promise` that resolves with a {@link BBoardAPI} instance that manages the newly deployed
   * {@link DeployedBBoardContract}; or rejects with a deployment error.
   */
  static async deploy(providers: BBoardProviders, logger?: Logger): Promise<BBoardAPI> {
    logger?.info('deployContract');

    // EXERCISE 5: FILL IN THE CORRECT ARGUMENTS TO deployContract
    const deployedBBoardContract = await deployContract<typeof bboardContractInstance>(providers, {
      privateStateId: bboardPrivateStateKey,
      contract: bboardContractInstance,
      initialPrivateState: await BBoardAPI.getPrivateState(providers),
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  /**
   * Finds an already deployed bulletin board contract on the network, and joins it.
   *
   * @param providers The bulletin board providers.
   * @param contractAddress The contract address of the deployed bulletin board contract to search for and join.
   * @param logger An optional 'pino' logger to use for logging.
   * @returns A `Promise` that resolves with a {@link BBoardAPI} instance that manages the joined
   * {@link DeployedBBoardContract}; or rejects with an error.
   */
  static async join(providers: BBoardProviders, contractAddress: ContractAddress, logger?: Logger): Promise<BBoardAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const deployedBBoardContract = await findDeployedContract<BBoardContract>(providers, {
      contractAddress,
      contract: bboardContractInstance,
      privateStateId: bboardPrivateStateKey,
      initialPrivateState: await BBoardAPI.getPrivateState(providers),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedBBoardContract.deployTxData.public,
      },
    });

    return new BBoardAPI(deployedBBoardContract, providers, logger);
  }

  private static async getPrivateState(providers: BBoardProviders): Promise<BBoardPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(bboardPrivateStateKey);
    return existingPrivateState ?? createBBoardPrivateState(utils.randomBytes(32));
  }
}

/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';

export * from './common-types.js';
