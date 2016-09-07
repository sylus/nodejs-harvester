// Node.js Files Script.

// NPM Utilities.
var moment = require('moment');
var uuid = require('./uuid.js');

// aemify class.
exports.aemify = function(result) {

    var uniqueUUID = new uuid();
    var dateIssued = moment().toString();
    var gcdateExpired = moment().add(1, 'year').toString();
    var gcModified = moment().format('YYYY-MM-DD');
    var fields = [
      'gcAudience',
      'gcInstitutionName',
      'gcPublisherOrgName',
      'gcSpatialCountry',
      'gcCreator',
      'gcDescription',
      'comments',
      'website_lang',
      'destination'
    ];

    for (var row in result.rows) {
        var iterator;
        var gcPublisherOrgName = [];
        var gcCreator = [];

        // Handle optional extra csv fields exclusive to AEM.
        for (var i = 0; i < fields.length; i++) {
            if (typeof result.rows[row][fields[i]] === 'undefined') {
                if (fields[i] === 'gcCreator') {
                    result.rows[row][fields[i]] = {};
                } else {
                    result.rows[row][fields[i]] = '';
                }
            }
        }
        if (typeof result.rows[row].gcPublisherOrgName.split !== 'undefined') {
            iterator = result.rows[row].gcPublisherOrgName.split('::');
            for (i = 0 ; i < iterator.length; i++) {
                gcPublisherOrgName.push(iterator[i]);
            }
        }
        if (typeof result.rows[row].gcCreator.split !== 'undefined') {
            iterator = result.rows[row].gcCreator.split('::');
            for (i = 0 ; i < iterator.length; i++) {
                gcCreator.push(iterator[i]);
            }
        }

        // AEM JSON Schema.
        result.rows[row] = {
            'id': result.rows[row].id,
            'uuid': uniqueUUID,
            'source_url': result.rows[row].website,
            'destination_path': result.rows[row].destination,
            'jcr:primaryType': 'cq:Page',
            'jcr:content': {
                'jcr:primaryType': 'cq:PageContent',
                'jcr:title': result.rows[row].title,
                'sling:resourceType': 'canada/components/structure/page-generic',
                'cq:template': '/apps/canada/templates/page-generic',
                'jcr:language': result.rows[row].language,
                'gcLanguage': result.rows[row].language === 'fr' ? 'fra' : 'eng',
                'gcAltLanguagePeer': result.rows[row].website_lang,
                'gcCustomElements': [],
                'gcISBN': '',
                'gcISSN': '',
                'gcKeywords': '',
                'gcIssued': dateIssued,
                'gcAudience': [
                  result.rows[row].gcAudience
                ],
                'gcFreeSubject': '',
                'gcPrimaryTopic': [],
                'gcDescription': result.rows[row].gcDescription,
                'gcGeographicRegionName': [],
                'gcPublisherOrgName': gcPublisherOrgName,
                'gcAdditionalTopics': [],
                'gcPublisherOrgNameatPublication': [],
                'gcContentType': [],
                'gcLicence': '',
                'gcSpatialCountry':  result.rows[row].gcSpatialCountry,
                'gcDateExpired': gcdateExpired,
                'gcDepartmentalCatalogueNumber': '',
                'gcBreadcrumb': [],
                'gcCredentialUsername': '',
                'gcCreator': gcCreator,
                'gcModified': gcModified,
                'ipar-header': {
                    'jcr:primaryType': 'nt:unstructured',
                    'sling:resourceType': 'wcm/foundation/components/iparsys',
                    'iparsys_fake_par': {
                        'jcr:primaryType': 'nt:unstructured',
                        'sling:resourceType': 'wcm/foundation/components/iparsys/par'
                    }
                },
                'title': {
                    'jcr:primaryType': 'nt:unstructured',
                    'text': result.rows[row].title,
                    'sling:resourceType': 'canada/components/content/mwstitle',
                    'textIsRich': 'true'
                },
                'par': {
                    'jcr:primaryType': 'nt:unstructured',
                    'sling:resourceType': 'foundation/components/parsys',
                    'text': {
                        'jcr:primaryType': 'nt:unstructured',
                        'text': result.rows[row].body,
                        'sling:resourceType': 'canada/components/content/mwstext',
                        'textIsRich': 'true'
                    }
                },
                'ipar-content-footer': {
                    'jcr:primaryType': 'nt:unstructured',
                    'sling:resourceType': 'wcm/foundation/components/iparsys',
                    'iparsys_fake_par': {
                        'jcr:primaryType': 'nt:unstructured',
                        'sling:resourceType': 'wcm/foundation/components/iparsys/par'
                    }
                },
                'ipar-footer': {
                    'jcr:primaryType': 'nt:unstructured',
                    'sling:resourceType': 'wcm/foundation/components/iparsys',
                    'iparsys_fake_par': {
                        'jcr:primaryType': 'nt:unstructured',
                        'sling:resourceType': 'wcm/foundation/components/iparsys/par'
                    }
                }
            }
        };

        // Handle removal of optional fields exclusive to AEM.
        for (i = 0; i < fields.length; i++) {
            if (typeof result.rows[row][fields[i]] !== 'undefined') {
                delete result.rows[row][fields[i]];
            }
        }
    }
};

// aemify_media class.
exports.aemify_media = function(result) {
    for (var row in result.rows) {
        // AEM JSON Image Schema.
        if (result.rows[row].type === 'image') {
            result.rows[row] = {
                'uuid': result.rows[row].id,
                'url': result.rows[row].url,
                'filename': result.rows[row].filename,
                'filename_uuid': result.rows[row].filename_uuid,
                'mwsadaptiveimage': {
                    'jcr:primaryType': 'nt:unstructured',
                    'sling:resourceType': 'canada/components/content/mwsadaptiveimage',
                    'image': {
                        'jcr:primaryType': 'nt:unstructured',
                        'fileReference': result.rows[row].filename,
                        'alt': '',
                        'isResponsive': 'true'
                    }
                }
            };
        } else {
            // AEM JSON File Schema.
            result.rows[row] = {
                'uuid': result.rows[row].id,
                'url': result.rows[row].url,
                'filename': result.rows[row].filename,
                'filename_uuid': result.rows[row].filename_uuid,
                'mwsfile': {
                    'jcr:primaryType': 'nt:unstructured',
                    'fileReference': result.rows[row].filename,
                    'sling:resourceType': 'canada/components/content/mwsfile'
                }
            };
        }
    }
};

// aemify_table class.
exports.aemify_table = function(result) {
    for (var row in result.rows) {
        // AEM JSON Table Schema.
        result.rows[row] = {
            'uuid': result.rows[row].id,
            'url': result.rows[row].url,
            'classes': result.rows[row].classes,
            'mwstable': {
                'jcr:primaryType': 'nt:unstructured',
                'text': result.rows[row].table_markup,
                'sling:resourceType': 'canada/components/content/mwstable-hf',
                'textIsRich': 'true'
            }
        };

    }
};
