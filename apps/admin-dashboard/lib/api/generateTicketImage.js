import QRCode from 'qrcode';
import findKey from 'lodash/findKey';
import isEmpty from 'lodash/isEmpty';
import sharp from 'sharp';

const generateTicketImage = async (user, supabase, b64 = false) => {
  const event = user.event;
  
  const eTicket = !isEmpty(event.ticket_template);
  
  let ticketNumber = (user.ticket_number ?? '').toString();

  if (!ticketNumber) {
    const { count } = await supabase.from('registered-users')
      .select(undefined, { count: 'exact', head: true })
      .eq('ticket_issued', true)
      .eq('registered_event', event.uuid);
  
    ticketNumber = (count + 1).toString();  
  }

  ticketNumber = ticketNumber.padStart(4, '0')
  
  if (eTicket) {
    const paymentConfig = event.payment_config || {};
  
    const userAgeMapping = findKey(paymentConfig.age_mapping, (ages) => {
      const { from: ageFrom, to: ageTo } = ages;
      return user.age >= ageFrom && user.age <= ageTo;
    });
  
    const { bucket, key, config } = event.ticket_template[userAgeMapping] || {};
  
    const { data: ticketTemplate, error: downloadError } = await supabase.storage.from(bucket).download(key);
  
    if (downloadError) {
      throw downloadError
    }
  
    const ticketTemplateBuffer = Buffer.from( await ticketTemplate.arrayBuffer() );
  
    await sharp({
      text: {
        // eslint-disable-next-line max-len
        text: `<span size="42pt" weight="bold" foreground="${config.colour?.dark?.hex}">${ticketNumber}</span>`,
        width: config.position?.number?.w,
        height: config.position?.number?.h,
        rgba: true
      }
    }).toFile('/tmp/number.png');
  
    const qrCodeInfo = `${user.registration_number}-${ticketNumber}`;
  
    const qrCodeOptions = {};
  
    if (config.position) {
      qrCodeOptions.width = config.position?.qrcode?.w;
    }
  
    if (config.colour) {
      qrCodeOptions.color = {
        light: config.colour?.light?.hex,
        dark: config.colour?.dark?.hex
      };
    }
  
    await QRCode.toFile('/tmp/qrcode.png', qrCodeInfo, qrCodeOptions);
  
    const qrCodeImg = await sharp(ticketTemplateBuffer).composite([
      {
        input: '/tmp/qrcode.png',
        top: Math.ceil(config.position?.qrcode?.y || 0),
        left: Math.ceil(config.position?.qrcode?.x || 0)
      },
      {
        input: '/tmp/number.png',
        top: Math.ceil(config.position?.number?.y || 0),
        left: Math.ceil(config.position?.number?.x || 0)
      }
    ]).png().toBuffer().then((buffer) => b64 ? buffer.toString('base64') : buffer);

    return { ticket: qrCodeImg, ticketNumber };
  }

  return { ticket: '', ticketNumber };
}

export default generateTicketImage;
