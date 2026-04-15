const normalizePhone = (value) => String(value || '').replace(/[^\d+]/g, '');

const sendSms = async ({ to, message }) => {
  const smsId = `sms_${Date.now()}`;
  const phone = normalizePhone(to);
  const encodedMessage = encodeURIComponent(String(message || ''));
  const whatsappLink = `https://wa.me/${phone.replace(/^\+/, '')}?text=${encodedMessage}`;
  const smsLink = `sms:${phone}?body=${encodedMessage}`;

  console.log(`WhatsApp/SMS notification prepared for ${phone}: ${message}`);

  return {
    smsId,
    whatsappLink,
    smsLink
  };
};

module.exports = {
  sendSms
};
