'use strict';

const ITO_COMPUTE_URL = 'https://compute.itomarkets.com';

function getComputeSponsorCopy() {
  // Itô is a compute provider this repo can bridge to, not a sponsor of Aiuby.
  // The sponsorship framing was inherited from ECC; see SPONSORS.md.
  return 'Run or self-host any open-source model. Any GPU provider works. '
    + 'Itô is a compute provider Aiuby can bridge to, not a sponsor. '
    + 'The opt-in "aiuby ito find" bridge invokes the explicitly configured '
    + 'canonical Itô CLI you installed yourself and submits a live authenticated '
    + 'RFQ; it does not reserve capacity, provision compute, or configure serving. '
    + 'Managed inference through Itô is not live yet. '
    + 'Itô dashboard: ' + ITO_COMPUTE_URL + '.';
}

module.exports = Object.freeze({
  ITO_COMPUTE_URL,
  getComputeSponsorCopy,
});
