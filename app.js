import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys'
import qrcode from 'qrcode-terminal'
import pino from 'pino'
import express from 'express'
//import { askAI } from './aiChat.js'
process.loadEnvFile()

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const allowedRemoteJid = process.env.ALLOWJID
import { handle } from './handle.js'


const processedMessages = new Map() 
const MSG_EXPIRY_MS = 10 * 60 * 1000 

function isAlreadyProcessed(messageId) {
    const now = Date.now()
    for (const [id, timestamp] of processedMessages) {
        if (now - timestamp > MSG_EXPIRY_MS) processedMessages.delete(id)
    }
    
    if (processedMessages.has(messageId)) return true
    processedMessages.set(messageId, now)
    return false
}
const app = express()

app.get('/', (req, res) => {res.send('Bot is running!')});

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    const sock = makeWASocket({
        auth: state,
        markOnlineOnConnect: false,
        logger: pino({ level: 'silent' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04'] 
    })

    if(!sock.authState.creds.registered) {
        const PhoneNumber = process.env.PHONE

        setTimeout(async ()=>{
            try{
                const code = await sock.requestPairingCode(PhoneNumber);
                console.log(`Code is ${code}`)
            }catch(err){console.log(err)};
        },4000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) {
            qrcode.generate(qr, { small: true })
        }
        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
           // console.log('connection closed due to', lastDisconnect?.error, ', reconnecting:', shouldReconnect)
            if (shouldReconnect) {
                sock.ev.removeAllListeners()
                connectToWhatsApp()
            }
        } else if (connection === 'open') {
            console.log('opened connection')
        }
    })

    sock.ev.on('messages.upsert', async (event) => {
        if (event.type !== 'notify') return
        for (const m of event.messages) {
            if (m.key.fromMe) continue
            
            // Skip duplicate messages
            const messageId = m.key.id
            if (isAlreadyProcessed(messageId)) {
                console.log('Skipping duplicate message:', messageId)
                continue
            }
            
            const remoteJid = m.key.remoteJid
            console.log(remoteJid)

            const text =
             m.message?.conversation ||
             m.message?.extendedTextMessage?.text ||'';
             console.log('Received message:', text)
            if (remoteJid === allowedRemoteJid) {
            
            if (text.trim().toLowerCase() === 'ping') {
                await sock.sendPresenceUpdate('composing', remoteJid)
                await delay(Math.floor(Math.random() * (5000-2000+1) + 2000));
                await sock.sendPresenceUpdate('paused', remoteJid)
                await sock.sendMessage(remoteJid, { text: 'pong' })
                //await sock.sendPresenceUpdate('unavailable')
            }

            else if (text.trim()) {
                await sock.sendPresenceUpdate('composing', remoteJid)
                await delay(Math.floor(Math.random() * (5000-2000+1) + 2000));
                try {
                    const reply = await handle(text,remoteJid)
                    await sock.sendMessage(remoteJid, { text: reply })
                } catch (error) {
                    console.error('AI reply failed:', error.message)
                    await sock.sendMessage(remoteJid, { text: 'Sorry, I could not answer right now.' })
                } finally {
                    await sock.sendPresenceUpdate('paused'  , remoteJid)
                   // await sock.sendPresenceUpdate('unavailable')
                }
            }
            }
        }
    });


sock.ev.on('creds.update', saveCreds)
}

connectToWhatsApp()

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})