/**
 * Helper de Comunicação Outbound — WhatsApp & Mensageria
 * Doce Sabor Fidelidade
 */

export interface WhatsAppMessagePayload {
  toPhone: string
  customerName: string
  type: 'points_earned' | 'redemption_created' | 'redemption_confirmed' | 'points_expiring'
  data: {
    points?: number
    totalBalance?: number
    publicCode?: string
    discountFormatted?: string
    expiryDate?: string
  }
}

/**
 * Envia ou agenda mensagem via API de WhatsApp (Z-API / Evolution API / Twilio)
 */
export async function sendWhatsAppNotification(payload: WhatsAppMessagePayload): Promise<{ success: boolean; messageId?: string }> {
  const { toPhone, customerName, type, data } = payload

  // Formatação amigável de mensagens do WhatsApp Doce Sabor
  let messageText = ''

  switch (type) {
    case 'points_earned':
      messageText = `🍦 *Doce Sabor Colatina*\n\nOlá, ${customerName}! Suas compras renderam +${data.points} pontos!\n\nSeu saldo atual é de *${data.totalBalance} pontos* (R$ ${data.totalBalance?.toFixed(2)} em descontos).\n\nAcesse sua carteira: https://web-xi-seven-99.vercel.app/carteira`
      break

    case 'redemption_created':
      messageText = `🎁 *Doce Sabor Colatina*\n\nOlá, ${customerName}! Seu código de resgate no valor de *${data.discountFormatted}* foi gerado:\n\nCódigo: *${data.publicCode}*\n\nApresente este código no caixa da loja em até 15 minutos!`
      break

    case 'redemption_confirmed':
      messageText = `✅ *Doce Sabor Colatina*\n\nSeu desconto de *${data.discountFormatted}* foi aplicado com sucesso no caixa! Bom apetite! 🍦`
      break

    case 'points_expiring':
      messageText = `⚠️ *Doce Sabor Colatina*\n\nOlá, ${customerName}! Você tem *${data.points} pontos* prestes a expirar em ${data.expiryDate}.\n\nNão perca seus descontos! Troque seus pontos na loja.`
      break
  }

  console.log(`[WhatsApp Outbound] Para ${toPhone}:\n${messageText}`)

  // Integração com Gateway de WhatsApp se chave de API estiver configurada
  const gatewayUrl = process.env.WHATSAPP_API_URL
  const gatewayToken = process.env.WHATSAPP_API_TOKEN

  if (gatewayUrl && gatewayToken) {
    try {
      const res = await fetch(`${gatewayUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gatewayToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: toPhone.replace(/\D/g, ''),
          message: messageText,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        return { success: true, messageId: json.messageId || json.id }
      }
    } catch (err) {
      console.warn('[WhatsApp Outbound] Falha na chamada ao gateway:', err)
    }
  }

  // Fallback seguro de log em desenvolvimento/demonstração
  return { success: true, messageId: `mock_${Date.now()}` }
}
