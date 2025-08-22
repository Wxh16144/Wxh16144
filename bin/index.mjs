#!/usr/bin/env node
import main from '../index.mjs';

main();

/**
// npm install wxh16144

// ESM:

import wxh16144 from 'wxh16144';

wxh16144({ hidelogo: true, pick: ['github'] });

// CJS:

import('wxh16144').then(({ default: main }) => main({ hidelogo: true, pick: ['github'] }));
*/
