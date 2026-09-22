const fs = require('fs');

try {
    require('./Tharusha/UserPerformance.test.js');
    console.log('✓ Syntax is valid');
} catch (error) {
    console.error('✗ Syntax error:', error.message);
}
