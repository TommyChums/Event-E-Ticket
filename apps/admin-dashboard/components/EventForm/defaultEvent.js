import moment from 'moment';
import { v4 } from 'uuid';

const defaultEvent = {
  uuid: v4(),
  name: 'My Event',
  is_online: false,
  payment_config: {
    age_mapping: { public: { to: 999, from: 0 } },
    price_by_age: { public: 0 },
    early_bird_date: null,
    early_bird_price_by_age: {},
  },
  is_published: false,
  start_date: moment().add(1, 'month').toISOString(),
  end_date: moment().add(1, 'month').add(1, 'hour').toISOString(),
  host: 'Reformation Life Centre',
  ticket_template: '',
  ticket_config: {
    colour: {
      dark: {
        hex: '#000',
        hsv: { h: 0, s: 0, v: 0 },
        rgb: { b: 0, g: 0, r: 0 },
      },
      light: {
        hex: '#fff',
        hsv: { h: 0, s: 0, v: 100 },
        rgb: { b: 255, g: 255, r: 255 },
      },
    },
    position: {
      number: {},
      qrcode: {},
    },
  },
  original_ticket_template: {
    public: {
      key: '',
      bucket: 'event-ticket-templates',
      config: {
        colour: {
          dark: {
            hex: '#000',
            hsv: { h: 0, s: 0, v: 0 },
            rgb: { b: 0, g: 0, r: 0 },
          },
          light: {
            hex: '#fff',
            hsv: { h: 0, s: 0, v: 100 },
            rgb: { b: 255, g: 255, r: 255 },
          },
        },
        position: {
          number: {},
          qrcode: {},
        },
      },
    },
  },
  logo: '',
  description: 'This is My Event',
  register_by_date: moment().add(1, 'month').subtract(1, 'day').toISOString(),
  venue: {
    address: 'Corner Ramlal Trace Ext, &, HHHJ+6PH, Uriah Butler Hwy, Charlieville, Trinidad and Tobago',
    geocode: '10.5780696,-61.4181477',
    place_id: 'ChIJg09iGL0ANowRgBn_xZpnMuc',
  },
  doors_open_by_date: moment().add(1, 'month').subtract(1, 'hour').toISOString(),
  branding: {
    primary_colour: {
      hex: '#020648',
      hsv: { h: 237, s: 97, v: 28 },
      rgb: { b: 2, g: 6, r: 72 },
    },
  },
  additional_user_information: {},
  banner: '',
};

export default defaultEvent;
