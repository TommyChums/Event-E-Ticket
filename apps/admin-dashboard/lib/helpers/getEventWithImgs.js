import isEmpty from 'lodash/isEmpty';
import forEach from 'lodash/forEach';

import supabase from '../supabase';

function getPublicURLForEventImgs(configObj, supabaseInstance) {
  let thisSupabase = supabase;

  if (supabaseInstance) {
    thisSupabase = supabaseInstance;
  }

  const returnObj = {
    publicURL: '',
    error: null
  };

  const { data } = thisSupabase.storage.from(configObj.bucket).getPublicUrl(configObj.key);

  returnObj.publicURL = data.publicUrl;

  return returnObj;
};

export default function getEventWithImgs(event, withTickets = true, supabaseInstance) {
  const newEvent = { ...event };

  const bannerLocation = newEvent.banner;
  const logoLocation = newEvent.logo;
  let err = null;

  if (!isEmpty(bannerLocation)) {
    const { publicURL, error } = getPublicURLForEventImgs(bannerLocation, supabaseInstance);

    err = error;

    newEvent.banner = publicURL;
  } else {
    newEvent.banner = '';
  }

  if (!isEmpty(logoLocation)) {
    const { publicURL, error } = getPublicURLForEventImgs(logoLocation, supabaseInstance);

    err = error;

    newEvent.logo = publicURL;
  } else {
    newEvent.logo = '';
  }

  if (withTickets) {
    const ticketConfig = newEvent.ticket_template;

    newEvent.ticket_template = {};
    newEvent.ticket_config = {};
    newEvent.original_ticket_template = {};

    if (ticketConfig) {
      forEach(ticketConfig, (ticketInfo, ageLabel) => {
        const { publicURL, error } = getPublicURLForEventImgs(ticketInfo, supabaseInstance);

        err = error;

        newEvent.ticket_template[ageLabel] = publicURL;

        newEvent.ticket_config[ageLabel] = ticketConfig[ageLabel]?.config || {};
        newEvent.original_ticket_template = ticketConfig;
      });
    }
  }


  return { data: newEvent, error: err };
};
