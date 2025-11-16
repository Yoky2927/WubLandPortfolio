const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF report
 * @param {Object} reportData - The data to include in the report
 * @param {String} reportType - Type of report (sales, rental, user_activity, dashboard)
 * @param {String} outputPath - Path to save the PDF (optional)
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePDF(reportData, reportType, outputPath = null) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const buffers = [];
            
            // Collect PDF data into buffer
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                if (outputPath) {
                    fs.writeFileSync(outputPath, pdfBuffer);
                }
                resolve(pdfBuffer);
            });

            // Add title
            doc.fontSize(20).text(`${reportData.title || 'Report'}`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).fillColor('gray').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
            doc.moveDown(2);

            // Add content based on report type
            doc.fillColor('black');
            doc.fontSize(12);

            switch (reportType) {
                case 'sales':
                case 'rental':
                    addSalesRentalReport(doc, reportData);
                    break;
                case 'user_activity':
                    addUserActivityReport(doc, reportData);
                    break;
                case 'dashboard':
                    addDashboardReport(doc, reportData);
                    break;
                default:
                    addGenericReport(doc, reportData);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

function addSalesRentalReport(doc, data) {
    doc.fontSize(16).text('Summary', { underline: true });
    doc.moveDown(0.5);
    
    if (data.summary) {
        doc.fontSize(11);
        doc.text(`Total Properties: ${data.summary.total || 0}`);
        doc.text(`Total Revenue: ${data.summary.totalRevenue || 0} ETB`);
        doc.text(`Average Price: ${data.summary.averagePrice || 0} ETB`);
        doc.text(`Completed Transactions: ${data.summary.completed || 0}`);
        doc.moveDown();
    }

    if (data.monthlyBreakdown && data.monthlyBreakdown.length > 0) {
        doc.fontSize(14).text('Monthly Breakdown', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        data.monthlyBreakdown.forEach(month => {
            doc.text(`${month.month}: ${month.count} properties, ${month.revenue} ETB`);
        });
        doc.moveDown();
    }

    if (data.topLocations && data.topLocations.length > 0) {
        doc.fontSize(14).text('Top Locations', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        data.topLocations.forEach((location, index) => {
            doc.text(`${index + 1}. ${location.address}: ${location.count} properties`);
        });
    }
}

function addUserActivityReport(doc, data) {
    doc.fontSize(16).text('User Statistics', { underline: true });
    doc.moveDown(0.5);
    
    if (data.statistics) {
        doc.fontSize(11);
        doc.text(`Total Users: ${data.statistics.totalUsers || 0}`);
        doc.text(`Active Users: ${data.statistics.activeUsers || 0}`);
        doc.text(`New Users: ${data.statistics.newUsers || 0}`);
        doc.text(`Total Transactions: ${data.statistics.totalTransactions || 0}`);
        doc.moveDown();
    }

    if (data.userActivity && data.userActivity.length > 0) {
        doc.fontSize(14).text('Recent Activity', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(9);
        
        data.userActivity.forEach(activity => {
            doc.text(`${activity.date}: ${activity.description}`);
        });
    }

    if (data.roleBreakdown) {
        doc.moveDown();
        doc.fontSize(14).text('Users by Role', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        Object.entries(data.roleBreakdown).forEach(([role, count]) => {
            doc.text(`${role}: ${count} users`);
        });
    }
}

function addDashboardReport(doc, data) {
    doc.fontSize(16).text('Dashboard Insights', { underline: true });
    doc.moveDown();
    
    if (data.overview) {
        doc.fontSize(12);
        Object.entries(data.overview).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`);
        });
        doc.moveDown();
    }

    if (data.topLocations && data.topLocations.length > 0) {
        doc.fontSize(14).text('Top Locations', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        data.topLocations.forEach((location, index) => {
            doc.text(`${index + 1}. ${location.address} - ${location.count} properties`);
        });
        doc.moveDown();
    }

    if (data.marketTrends) {
        doc.fontSize(14).text('Market Trends', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        if (data.marketTrends.priceTrend) {
            doc.text(`Price Trend: ${data.marketTrends.priceTrend}`);
        }
        if (data.marketTrends.demandTrend) {
            doc.text(`Demand Trend: ${data.marketTrends.demandTrend}`);
        }
        if (data.marketTrends.topPropertyTypes) {
            doc.text(`Top Property Types: ${data.marketTrends.topPropertyTypes.join(', ')}`);
        }
    }
}

function addGenericReport(doc, data) {
    doc.fontSize(12);
    
    if (typeof data === 'object') {
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'object') {
                doc.text(`${key}:`);
                doc.moveDown(0.3);
                doc.fontSize(10);
                Object.entries(value).forEach(([subKey, subValue]) => {
                    doc.text(`  ${subKey}: ${subValue}`);
                });
                doc.fontSize(12);
                doc.moveDown(0.5);
            } else {
                doc.text(`${key}: ${value}`);
            }
        });
    } else {
        doc.text(String(data));
    }
}

module.exports = { generatePDF };

