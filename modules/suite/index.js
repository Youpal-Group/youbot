const xml2js = require('xml2js');
const vcf = require('vcardparser');

const authToken = 'Basic ' + Buffer.from(process.env.SUITE_USERNAME + ':' + process.env.SUITE_PASSWORD).toString('base64');

const validateCard = (json) => {
    try {
        const card = json['d:multistatus']['d:response'][0]['d:propstat'][0]['d:prop'][0]['card:address-data'][0];
        return card;
    }
    catch (err) {
        return false;
    }
}

module.exports = {
	name: 'suite',
	script: (bot) => {
        if (process.env.SUITE === 'true') {
            bot.logger.info('YouSuite', 'Initializing...');

            return {
                contact: async (field, query) => {
                    return new Promise((resolve, reject) => {
                        try {
                            const headers = {
                                'Content-Type': 'text/xml',
                                Encoding: 'utf-8',
                                Depth: 1,
                                Authorization: authToken
                            };
                
                            const data = `<?xml version="1.0" encoding="utf-8" ?><C:addressbook-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav"><D:prop><D:getetag/><C:address-data><C:prop name="VERSION"/><C:prop name="UID"/><C:prop name="TITLE"/><C:prop name="EMAIL"/><C:prop name="FN"/></C:address-data></D:prop><C:filter><C:prop-filter name="${field.toUpperCase()}"><C:text-match collation="i;unicode-casemap" match-type="equals">${query}</C:text-match></C:prop-filter></C:filter></C:addressbook-query>`;

                            bot.http({
                                url: process.env.SUITE_URL + '/remote.php/carddav/addressbooks/' + process.env.SUITE_USERNAME + '/contacts',
                                method: 'REPORT',
                                headers: headers,
                                data: data
                            })
                                .then((response) => {
                                    xml2js.parseStringPromise(response.data)
                                    .then((json) => {
                                        const vcard = validateCard(json);

                                        if (!vcard) return resolve(false);
                                        
                                        vcf.parseString(vcard, (err, jsCard) => {
                                            if (err) {
                                                bot.logger.error('YouSuite', err);

                                                return resolve(false);
                                            }
                                            
                                            return resolve(jsCard);
                                        });
                                    })
                                    .catch((err) => {
                                        bot.logger.error('YouSuite', err);
                                        return resolve(false);
                                    });
                                })
                                .catch((err) => {
                                    bot.logger.error('YouSuite', err);
                                    return resolve(false);
                                });
                        }
                        catch (err) {
                            bot.logger.error('YouSuite', err);
                            return resolve(false);
                        }
                    });
                }
            };
        }
        else {
            bot.logger.info('YouSuite', 'Disabled');
        }
	}
};
