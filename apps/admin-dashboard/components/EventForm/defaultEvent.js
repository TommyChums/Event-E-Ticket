import moment from 'moment';
import { v4 } from 'uuid';

const defaultEvent = {
  uuid: v4(),
  name: 'My Event',
  is_online: false,
  payment_config: {
    age_mapping: { general: { to: 999, from: 0 } },
    price_by_age: { general: 0 },
    early_bird_date: null,
    early_bird_price_by_age: {}
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
        rgb: { b: 0, g: 0, r: 0 }
      },
      light: {
        hex: '#fff',
        hsv: { h: 0, s: 0, v: 100 },
        rgb: { b: 255, g: 255, r: 255 }
      }
    },
    position: {
      number: {},
      qrcode: {}
    }
  },
  original_ticket_template: {
    general: {
      key: '',
      bucket: 'event-ticket-templates',
      config: {
        colour: {
          dark: {
            hex: '#000',
            hsv: { h: 0, s: 0, v: 0 },
            rgb: { b: 0, g: 0, r: 0 }
          },
          light: {
            hex: '#fff',
            hsv: { h: 0, s: 0, v: 100 },
            rgb: { b: 255, g: 255, r: 255 }
          }
        },
        position: {
          number: {},
          qrcode: {}
        }
      }
    }
  },
  logo: '',
  description: 'This is My Event',
  register_by_date: moment().add(1, 'month').subtract(1, 'day').toISOString(),
  venue: {
    address: 'Corner Ramlal Trace Ext, &, HHHJ+6PH, Uriah Butler Hwy, Charlieville, Trinidad and Tobago',
    geocode: '10.5780696,-61.4181477',
    place_id: 'ChIJg09iGL0ANowRgBn_xZpnMuc'
  },
  doors_open_by_date: moment().add(1, 'month').subtract(1, 'hour').toISOString(),
  branding: {
    primary_colour: {
      hex: '#020648',
      hsv: { h: 237, s: 97, v: 28 },
      rgb: { b: 2, g: 6, r: 72 }
    }
  },
  registration_form_fields: {
    email: {
      field_name: 'email',
      field_label: 'Email',
      field_type: 'email',
      order: 1,
      required: true
    },
    first_name: {
      field_name: 'first_name',
      field_label: 'First Name',
      field_type: 'text',
      order: 2,
      required: true
    },
    last_name: {
      field_name: 'last_name',
      field_label: 'Last Name',
      field_type: 'text',
      order: 3,
      required: true
    },
    phone_number: {
      field_name: 'phone_number',
      field_label: 'Phone Number',
      field_type: 'phone_number',
      order: 4,
      required: true
    },
    date_of_birth: {
      field_name: 'date_of_birth',
      field_label: 'Date of Birth',
      field_type: 'date',
      order: 5,
      required: true
    },
  },
  banner: ''
};

export default defaultEvent;
