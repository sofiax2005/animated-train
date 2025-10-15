// script.js - Fixed version: Corrected selectors, JS syntax (slice), decomposition logic, rendering consistency, and added more data for demo
class NormalizationViz {
    constructor() {
        this.svg = d3.select('#svg');
        this.width = 1200;
        this.height = 800;
        this.currentNF = 0;
        this.redundancy = 15;
        this.data = this.initData();
        this.simulation = null;
        this.tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);
        this.narrator = d3.select('#narrator');
        this.setupSVG();
        this.bindEvents();
        this.renderInitial();
    }

    initData() {
        // Expanded medical dataset with more redundancies for better demo
        return [
            { Patient_ID: 'P001', Patient_Name: 'Alice Johnson', Doctor_ID: 'D001', Doctor_Name: 'Dr. Smith', Hospital_ID: 'H001', Hospital_Name: 'City Hospital', Appointment_Date: '2025-01-10', Treatment_ID: 'T001,T002', Treatment_Name: 'Checkup,Antibiotics', Diagnosis: 'Flu', Notes: 'Follow-up needed' },
            { Patient_ID: 'P002', Patient_Name: 'Bob Wilson', Doctor_ID: 'D001', Doctor_Name: 'Dr. Smith', Hospital_ID: 'H001', Hospital_Name: 'City Hospital', Appointment_Date: '2025-01-15', Treatment_ID: 'T001', Treatment_Name: 'Checkup', Diagnosis: 'Cold', Notes: 'Rest advised' },
            { Patient_ID: 'P001', Patient_Name: 'Alice Johnson', Doctor_ID: 'D002', Doctor_Name: 'Dr. Lee', Hospital_ID: 'H002', Hospital_Name: 'General Clinic', Appointment_Date: '2025-02-01', Treatment_ID: 'T002,T003', Treatment_Name: 'Antibiotics,X-Ray', Diagnosis: 'Fracture', Notes: 'Pain management' },
            { Patient_ID: 'P003', Patient_Name: 'Carol Davis', Doctor_ID: 'D001', Doctor_Name: 'Dr. Smith', Hospital_ID: 'H001', Hospital_Name: 'City Hospital', Appointment_Date: '2025-02-05', Treatment_ID: 'T004', Treatment_Name: 'Surgery', Diagnosis: 'Appendicitis', Notes: 'Post-op care' },
            { Patient_ID: 'P004', Patient_Name: 'David Brown', Doctor_ID: 'D002', Doctor_Name: 'Dr. Lee', Hospital_ID: 'H002', Hospital_Name: 'General Clinic', Appointment_Date: '2025-02-10', Treatment_ID: 'T001,T003', Treatment_Name: 'Checkup,X-Ray', Diagnosis: 'Injury', Notes: 'Rehab plan' },
            { Patient_ID: 'P005', Patient_Name: 'Eve Garcia', Doctor_ID: 'D003', Doctor_Name: 'Dr. Patel', Hospital_ID: 'H001', Hospital_Name: 'City Hospital', Appointment_Date: '2025-02-15', Treatment_ID: 'T002', Treatment_Name: 'Antibiotics', Diagnosis: 'Infection', Notes: 'Antibiotics prescribed' },
            { Patient_ID: 'P002', Patient_Name: 'Bob Wilson', Doctor_ID: 'D001', Doctor_Name: 'Dr. Smith', Hospital_ID: 'H001', Hospital_Name: 'City Hospital', Appointment_Date: '2025-03-01', Treatment_ID: 'T005', Treatment_Name: 'Therapy', Diagnosis: 'Back Pain', Notes: 'Physical therapy' }
        ];
    }

    setupSVG() {
        this.svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 15)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', 'var(--line-color)');

        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    bindEvents() {
        d3.select('#start-btn').on('click', () => this.nextNF());
        d3.select('#reset-btn').on('click', () => this.reset());
        this.svg.on('mousemove', (event) => this.hideTooltip(event));
    }

    renderInitial() {
        this.narrator.text('Welcome! This medical dataset is chaotic with redundancies. Hover over cards to see duplicates. Click "Start Normalizing" to begin the journey to 5NF.');
        this.updateProgress();
        this.renderCards(this.data, true);
    }

    renderCards(data, chaotic = false) {
        this.svg.selectAll('.card-group, .line, .table-cluster').remove();

        const cardGroups = this.svg.selectAll('.card-group')
            .data(data, d => `${d.Patient_ID}-${d.Appointment_Date}`);

        cardGroups.exit().transition().duration(500).style('opacity', 0).remove();

        const enterGroups = cardGroups.enter().append('g')
            .attr('class', 'card-group')
            .attr('transform', (d, i) => `translate(${Math.random() * this.width}, ${Math.random() * this.height})`);

        enterGroups.append('rect')
            .attr('class', 'card')
            .attr('width', 150)
            .attr('height', 80)
            .attr('rx', 5)
            .on('mouseover', (event, d) => this.showTooltip(event, this.formatCardData(d)))
            .on('mouseout', (event) => this.hideTooltip(event));

        const texts = enterGroups.append('g').attr('class', 'card-texts');
        texts.append('text').attr('x', 5).attr('y', 15).text(d => `P: ${d.Patient_Name}`);
        texts.append('text').attr('x', 5).attr('y', 30).text(d => `Dr: ${d.Doctor_Name}`);
        texts.append('text').attr('x', 5).attr('y', 45).text(d => `H: ${d.Hospital_Name}`);
        texts.append('text').attr('x', 5).attr('y', 60).text(d => `Dx: ${d.Diagnosis}`);

        if (chaotic) {
            this.simulation = d3.forceSimulation(data)
                .force('charge', d3.forceManyBody().strength(-50))
                .force('center', d3.forceCenter(this.centerX, this.centerY))
                .force('collision', d3.forceCollide(20))
                .on('tick', () => {
                    enterGroups.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);
                    cardGroups.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);
                });
        } else {
            enterGroups.attr('transform', (d, i) => {
                const row = Math.floor(i / 3);
                const col = i % 3;
                return `translate(${col * 200 + 50}, ${row * 100 + 50})`;
            });
        }

        cardGroups.transition().duration(1000)
            .attr('transform', (d, i) => {
                const row = Math.floor(i / 3);
                const col = i % 3;
                return `translate(${col * 200 + 50}, ${row * 100 + 50})`;
            });
    }

    formatCardData(d) {
        return Object.entries(d).map(([k, v]) => `${k}: ${v}`).join('\n');
    }

    showTooltip(event, content) {
        this.tooltip.style('opacity', 1)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .html(content.replace(/\n/g, '<br>'));
    }

    hideTooltip(event) {
        this.tooltip.transition().duration(500).style('opacity', 0);
    }

    nextNF() {
        if (this.currentNF >= 5) return;
        this.currentNF++;
        this.processNF(this.currentNF);
        this.updateProgress();
        d3.select('#start-btn').property('disabled', this.currentNF >= 5);
        d3.select('#reset-btn').style('display', 'inline-block');
    }

    processNF(nf) {
        let processedData = [...this.data];
        let narratorText = '';

        switch (nf) {
            case 1:
                processedData = this.splitMultiValues(processedData, 'Treatment_ID', ',');
                processedData = this.splitMultiValues(processedData, 'Treatment_Name', ',');
                // Adjust data for split (duplicate rows for each treatment)
                processedData = processedData.map(row => ({ ...row, Treatment_ID: row.Treatment_ID, Treatment_Name: row.Treatment_Name }));
                this.redundancy -= 5;
                narratorText = '1NF: Atomic values only. Split multi-valued treatments into separate records.';
                break;
            case 2:
                this.redundancy -= 4;
                narratorText = '2NF: No partial dependencies. Split into Patients and Appointments tables.';
                break;
            case 3:
                this.redundancy -= 3;
                narratorText = '3NF: No transitive dependencies. Extract Hospitals table.';
                break;
            case 4:
                this.redundancy -= 2;
                narratorText = '4NF: No multi-valued dependencies. Separate Doctor-Treatment associations.';
                break;
            case 5:
                this.redundancy = 0;
                narratorText = '5NF: No join dependencies. Final decomposition into lossless tables.';
                break;
            default:
                throw new Error('Invalid NF level');
        }

        this.data = processedData;
        this.narrator.text(narratorText);
        if (nf === 1) {
            this.renderCards(this.data, false); // Show ordered cards for 1NF
        } else {
            this.renderERDiagram(nf);
        }
    }

    splitMultiValues(data, field, delimiter) {
        return data.flatMap(row => {
            if (!row[field].includes(delimiter)) return [row];
            const values = row[field].split(delimiter);
            return values.map((val, idx) => {
                const newRow = { ...row };
                newRow[field] = val.trim();
                // Duplicate other fields for each split
                return newRow;
            });
        });
    }

    renderERDiagram(nf) {
        this.svg.selectAll('.table-cluster, .line, .card-group').remove();
        const allTables = ['Patients', 'Appointments', 'Doctors', 'Hospitals', 'Treatments', 'DoctorTreatments'];
        const tables = allTables.slice(0, nf + 1); // Fixed JS slice
        const tableData = tables.map((table, i) => ({
            id: table,
            x: this.width / (tables.length + 1) * (i + 1),
            y: this.height / 2,
            attributes: this.getAttributesForTable(table)
        }));

        const tableGroups = this.svg.selectAll('.table-cluster')
            .data(tableData, d => d.id);

        tableGroups.exit().remove();

        const enterTables = tableGroups.enter().append('g')
            .attr('class', 'table-cluster')
            .attr('transform', (d, i) => `translate(${this.width / 2 - 100}, ${this.height / 2 - 50})`);

        const rects = enterTables.append('rect')
            .attr('width', 200)
            .attr('height', 20 + tableData[0]?.attributes?.length * 12 || 100)
            .attr('rx', 5)
            .attr('class', 'card ordered')
            .attr('fill', 'var(--table-bg)');

        enterTables.append('text')
            .attr('x', 100)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .text(d => d.id)
            .style('font-weight', 'bold')
            .style('font-size', '14px');

        const attrTexts = enterTables.selectAll('.attr-text')
            .data(d => d.attributes)
            .enter().append('text')
            .attr('class', 'attr-text card-text')
            .attr('x', 10)
            .attr('y', (d, i) => 35 + i * 12)
            .text(d => d)
            .style('font-size', '10px');

        tableGroups.transition().duration(1000)
            .attr('transform', d => `translate(${d.x - 100}, ${d.y - 50})`);

        // Update existing
        tableGroups.select('rect')
            .transition().duration(1000)
            .attr('height', d => 20 + d.attributes.length * 12);

        this.drawRelationships(tableData, tables);
    }

    getAttributesForTable(table) {
        const attrs = {
            Patients: ['Patient_ID (PK)', 'Patient_Name'],
            Appointments: ['Appointment_ID (PK)', 'Patient_ID (FK)', 'Doctor_ID (FK)', 'Hospital_ID (FK)', 'Appointment_Date', 'Diagnosis', 'Notes'],
            Doctors: ['Doctor_ID (PK)', 'Doctor_Name'],
            Hospitals: ['Hospital_ID (PK)', 'Hospital_Name'],
            Treatments: ['Treatment_ID (PK)', 'Treatment_Name'],
            DoctorTreatments: ['Doctor_ID (FK)', 'Treatment_ID (FK)']
        };
        return attrs[table] || [];
    }

    drawRelationships(tableData, tables) {
        this.svg.selectAll('.line').remove(); // Clear previous lines
        const relationships = [
            { from: 'Appointments', to: 'Patients', label: 'Patient_ID' },
            { from: 'Appointments', to: 'Doctors', label: 'Doctor_ID' },
            { from: 'Appointments', to: 'Hospitals', label: 'Hospital_ID' },
            { from: 'DoctorTreatments', to: 'Doctors', label: 'Doctor_ID' },
            { from: 'DoctorTreatments', to: 'Treatments', label: 'Treatment_ID' }
        ];

        relationships.forEach(rel => {
            if (!tables.includes(rel.from) || !tables.includes(rel.to)) return;
            const fromTable = tableData.find(t => t.id === rel.from);
            const toTable = tableData.find(t => t.id === rel.to);
            if (fromTable && toTable) {
                this.svg.append('line')
                    .attr('class', 'line relationship')
                    .attr('x1', fromTable.x)
                    .attr('y1', fromTable.y)
                    .attr('x2', toTable.x)
                    .attr('y2', toTable.y)
                    .attr('marker-end', 'url(#arrowhead)');
            }
        });
    }

    updateProgress() {
        d3.select('#redundancy').text(this.redundancy);
        const nfText = this.currentNF === 0 ? 'Unnormalized' : `${this.currentNF}NF`;
        d3.select('#current-nf').text(nfText);
    }

    reset() {
        this.currentNF = 0;
        this.redundancy = 15;
        this.data = this.initData();
        this.svg.selectAll('*').remove();
        if (this.simulation) this.simulation.stop();
        this.narrator.text('Reset! Ready to normalize again.');
        this.updateProgress();
        d3.select('#start-btn').property('disabled', false);
        d3.select('#reset-btn').style('display', 'none');
        this.renderInitial();
    }
}

// Initialize with error handling
try {
    new NormalizationViz();
    console.log('Visualization loaded successfully!');
} catch (error) {
    console.error('Initialization failed:', error);
    d3.select('#narrator').text(`Error loading visualization: ${error.message}. Check console for details.`);
}
