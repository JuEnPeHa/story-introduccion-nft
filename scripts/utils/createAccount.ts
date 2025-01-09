import * as fs from 'fs';
import * as path from 'path';
import { Chain, createPublicClient, http } from 'viem';

import { english, generateMnemonic, HDAccount, mnemonicToAccount } from 'viem/accounts';


interface WalletData {
    address: string;
    privateKey: string;
    mnemonic: string;
}

/**
 * Solo usar en entornos de desarrollo
 */
const WALLET_FILE = path.join(__dirname, 'wallet.json');

function loadWallet(): WalletData | null {
    try {
        const data = fs.readFileSync(WALLET_FILE, 'utf-8');
        return JSON.parse(data)
    } catch (error) {
        return null;
    }
}

function saveWallet(wallet: WalletData): void {
    fs.writeFileSync(WALLET_FILE, JSON.stringify(wallet, null, 2), 'utf-8');
}

function generateWallet(): WalletData {
    // Generar una frase mnemonic
    const mnemonic : string = generateMnemonic(english);
    // Crear la cuenta
    const account : HDAccount = mnemonicToAccount(mnemonic);
    // Clave privada
    const pk : string = Buffer.from(account.getHdKey().privateKey ?? '').toString('hex')

    return {
        address: account.address,
        privateKey: pk,
        mnemonic: mnemonic,
    }
}

async function ensureWalletExist(): Promise<[WalletData, bigint]> {
    let wallet: WalletData | null = loadWallet();

    if (!wallet) {
        console.log("La billetera no se encontró, generando una nueva");
        wallet = generateWallet();
        saveWallet(wallet);
    } else {
        console.log("La billetera si existe")
    }

    const chain : Chain = {
        id: 1516,
        name: "Story Odyssey",
        nativeCurrency: {
            decimals: 18,
            name: 'IP',
            symbol: 'IP',
          },
          rpcUrls: {
            default: { http: ['https://rpc.odyssey.storyrpc.io'] },
          },
          blockExplorers: {
            default: {
                name: 'Story Odyssey Explorer',
                url: 'https://odyssey.storyscan.xyz',
            }
          },
          testnet: true
    }

    const pClient = createPublicClient({
        chain: chain,
        transport: http("https://rpc.odyssey.storyrpc.io")
    });

    const balance : bigint = await pClient. getBalance({
        address: wallet.address as `0x${string}`
    })

    return [wallet, balance];
}

if (require.main == module) {
    (async () => {
        const [wallet, balance ] = await ensureWalletExist();
        console.log("Información de la wallet")
        console.log("Address: " + wallet.address)
        console.log("Saldo: " + balance.toString())
    }) ();
}

export { ensureWalletExist };
