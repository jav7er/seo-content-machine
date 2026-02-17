// Entry point for cPanel (Phusion Passenger)
// This file points to the standalone Next.js server

const path = require('path');

// Set process.env.PORT if not already set by cPanel
process.env.PORT = process.env.PORT || 3000;
process.env.NODE_ENV = 'production';

// Load the Next.js standalone server
require('./server.js');
