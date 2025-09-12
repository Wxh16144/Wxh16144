#!/usr/bin/env node
import main from '../index.mjs';

main();

/**
// npm install wxh16144

// ESM (Node.js >= 16):

import wxh16144, { contactList } from 'wxh16144';

await wxh16144({ hidelogo: true, pick: ['github'] });

// CJS (Node.js >= 16):

import('wxh16144')
  .then(({ default: main }) => main({ hidelogo: true, pick: ['github'] }));

// Browser

import contact from 'wxh16144/contact';

// CDN (Global variable: Wxh16144)
<script defer src="https://cdn.jsdelivr.net/npm/wxh16144/contact.js"></script>
*/
