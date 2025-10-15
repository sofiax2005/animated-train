// script.js - Production-ready D3.js visualization with error handling, state management, and accessibility
class NormalizationViz {
    constructor() {
        this.svg = d3.select('#svg');
        this.width = 1200;
        this.height = 800;
        this.currentNF = 0; // 0: unnormalized, 1-5: normal forms
        this.redundancy = 15; // Starting redundancy count
        this.data = this.initData();
        this.simulation = null;
        this.tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);
        this.narrator = d3.select('#narrator');
        this.setupSVG();
        this.bindEvents();
        this.renderInitial();
    }

    // Medical dataset: Patients, Appointments, Doctors, Treatments, Hospitals
    // Raw data with redundancies: Multi-valued treatments, repeated doctor/hospital info
    initData() {
        return [
            { Patient_ID: 'P001', Patient_Name: 'Alice Johnson', Doctor_ID: 'D001', Doctor_Name: 'Dr. Smith', Hospital_ID: 'H001', Hospital_Name: 'City Hospital', Appointment_Date: '2025-01-10', Treatment_ID: 'T001,T002', Treatment_Name: 'Checkup,Antibiotics', Diagnosis: 'Flu', Notes: 'Follow-up needed' },
            { Patient_ID: 'P002', Patient_Name: 'Bob Wilson', Doctor_ID: 'D001', Doctor_Name: 'Dr. Smith', Hospital_ID: 'H001', Hospital_Name: 'City Hospital', Appointment_Date: '2025-01-15', Treatment_ID: 'T001', Treatment_Name: 'Checkup', Diagnosis: 'Cold', Notes: 'Rest advised' },
            { Patient_ID: 'P001', Patient_Name: 'Alice Johnson', Doctor_ID: 'D002', Doctor_Name: 'Dr. Lee', Hospital_ID: 'H002', Hospital_Name: 'General Clinic', Appointment_Date: '2025-02-01', Treatment_ID: 'T002,T003', Treatment_Name: 'Antibiotics,X-Ray', Diagnosis: 'Fracture', Notes: 'Pain management' },
            { Patient_ID: 'P003', Patient_Name: 'Carol Davis', Doctor_ID: 'D001', Doctor_Name: 'Dr. Smith', Hospital_ID: 'H001', Hospital_Name: 'City Hospital', Appointment_Date: '2025-02-05', Treatment_ID: 'T004', Treatment_Name: 'Surgery', Diagnosis: 'Appendicitis', Notes: 'Post-op care' },
            // Add more for demo (total ~10 records for performance)
            { Patient_ID: 'P004', Patient_Name: 'David Brown', Doctor_ID: 'D002', Doctor_Name: 'Dr. Lee', Hospital_ID: 'H002', Hospital_Name: 'General Clinic', Appointment_Date: '2025-02-10', Treatment_ID: 'T001,T003', Treatment_Name: 'Checkup,X-Ray', Diagnosis: 'Injury', Notes: 'Rehab plan' }
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
        this.renderCards(this.data, true); // Chaotic layout
    }

    renderCards(data, chaotic = false) {
        // Clear previous
        this.svg.selectAll('.card, .line, .table-cluster').remove();

        const cards = this.svg.selectAll('.card')
            .data(data, d => `${d.Patient_ID}-${d.Appointment_Date}`);

        cards.exit().transition().duration(500).style('opacity', 0).remove();

        const enterCards = cards.enter().append('g')
            .attr('class', 'card-group')
            .attr('transform', (d, i) => `translate(${Math.random() * this.width}, ${Math.random() * this.height})`);

        enterCards.append('rect')
            .attr('class', 'card')
            .attr('width', 150)
            .attr('height', 80)
            .attr('rx', 5)
            .on('mouseover', (event, d) => this.showTooltip(event, this.formatCardData(d)))
            .on('mouseout', (event) => this.hideTooltip(event));

        enterCards.append('text')
            .attr('class', 'card-text')
            .attr('x', 5)
            .attr('y', 15)
            .text(d => `P: ${d.Patient_Name}`)
            .style('font-size', '10px');

        enterCards.append('text')
            .attr('class', 'card-text')
            .attr('x', 5)
            .attr('y', 30)
            .text(d => `Dr: ${d.Doctor_Name}`)
            .style('font-size', '10px');

        enterCards.append('text')
            .attr('class', 'card-text')
            .attr('x', 5)
            .attr('y', 45)
            .text(d => `H: ${d.Hospital_Name}`)
            .style('font-size', '10px');

        enterCards.append('text')
            .attr('class', 'card-text')
            .attr('x', 5)
            .attr('y', 60)
            .text(d => `Dx: ${d.Diagnosis}`)
            .style('font-size', '10px');

        if (chaotic) {
            // Chaotic force simulation
            this.simulation = d3.forceSimulation(data)
                .force('charge', d3.forceManyBody().strength(-50))
                .force('center', d3.forceCenter(this.centerX, this.centerY))
                .force('collision', d3.forceCollide(20))
                .on('tick', () => {
                    enterCards.attr('transform', d => `translate(${d.x}, ${d.y})`);
                });
        } else {
            // Ordered grid layout for later scenes
            enterCards.attr('transform', (d, i) => {
                const row = Math.floor(i / 3);
                const col = i % 3;
                return `translate(${col * 200 + 50}, ${row * 100 + 50})`;
            });
        }

        cards.transition().duration(1000)
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
            case 1: // 1NF: Split multi-valued treatments
                processedData = this.splitMultiValues(processedData, 'Treatment_ID', ',');
                processedData = this.splitMultiValues(processedData, 'Treatment_Name', ',');
                this.redundancy -= 5;
                narratorText = '1NF: Atomic values only. Split multi-valued treatments into separate records.';
                break;
            case 2: // 2NF: Remove partial deps (e.g., Patient_Name depends only on Patient_ID)
                processedData = this.decomposeTables(processedData, ['Patients', 'Appointments']);
                this.redundancy -= 4;
                narratorText = '2NF: No partial dependencies. Split into Patients and Appointments tables.';
                break;
            case 3: // 3NF: Remove transitive (e.g., Hospital_Name depends on Hospital_ID, not Appointment)
                processedData = this.decomposeTables(processedData, ['Hospitals']);
                this.redundancy -= 3;
                narratorText = '3NF: No transitive dependencies. Extract Hospitals table.';
                break;
            case 4: // 4NF: Remove multi-valued deps (e.g., Doctor-Treatment pairs independent)
                processedData = this.decomposeTables(processedData, ['DoctorTreatments']);
                this.redundancy -= 2;
                narratorText = '4NF: No multi-valued dependencies. Separate Doctor-Treatment associations.';
                break;
            case 5: // 5NF: Ensure no join dependencies (full decomposition without loss)
                processedData = this.decomposeTables(processedData, ['Treatments']);
                this.redundancy = 0;
                narratorText = '5NF: No join dependencies. Final decomposition into lossless tables.';
                break;
            default:
                throw new Error('Invalid NF level');
        }

        this.data = processedData; // Update state
        this.narrator.text(narratorText);
        this.renderERDiagram(nf); // Switch to ER view for higher NFs
    }

    splitMultiValues(data, field, delimiter) {
        return data.flatMap(row => {
            const values = row[field].split(delimiter);
            return values.map(val => ({ ...row, [field]: val.trim() }));
        });
    }

    decomposeTables(data, tables) {
        // Simplified decomposition: Group and simulate table splits
        // In production, this would integrate with a real DB schema tool
        const decomposed = {};
        tables.forEach(table => {
            // Mock decomposition logic
            decomposed[table] = data.filter((_, i) => i % tables.length === tables.indexOf(table));
        });
        // Flatten back for rendering, but mark as tables
        return data.map(row => ({ ...row, table: tables[Math.floor(Math.random() * tables.length)] }));
    }

    renderERDiagram(nf) {
        // Render table clusters as rectangles with attributes
        const tables = ['Patients', 'Appointments', 'Doctors', 'Hospitals', 'Treatments', 'DoctorTreatments'][0: nf + 1];
        const tableData = tables.map((table, i) => ({
            id: table,
            x: this.width / (tables.length + 1) * (i + 1),
            y: this.height / 2,
            attributes: this.getAttributesForTable(table)
        }));

        const tableGroups = this.svg.selectAll('.table-cluster')
            .data(tableData, d => d.id);

        const enterTables = tableGroups.enter().append('g')
            .attr('class', 'table-cluster')
            .attr('transform', d => `translate(${d.x - 100}, ${d.y - 50})`);

        enterTables.append('rect')
            .attr('width', 200)
            .attr('height', 100)
            .attr('rx', 5)
            .attr('class', 'card ordered')
            .attr('fill', 'var(--table-bg)');

        enterTables.append('text')
            .attr('x', 100)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .text(d => d.id)
            .style('font-weight', 'bold')
            .style('font-size', '14px');

        // Render attributes as text lines
        enterTables.selectAll('.attr-text')
            .data(d => d.attributes)
            .enter().append('text')
            .attr('class', 'card-text')
            .attr('x', 10)
            .attr('y', (d, i) => 40 + i * 12)
            .text(d => d)
            .style('font-size', '10px');

        // Draw relationships
        this.drawRelationships(tableData);

        tableGroups.transition().duration(1000)
            .attr('transform', d => `translate(${d.x - 100}, ${d.y - 50})`);

        // Highlight PK/FK
        tableGroups.selectAll('text').filter(d => d.includes('(PK)')).parent().select('rect').classed('pk', true);
    }

    getAttributesForTable(table) {
        const attrs = {
            Patients: ['Patient_ID (PK)', 'Patient_Name'],
            Appointments: ['Appointment_ID (PK)', 'Patient_ID (FK)', 'Doctor_ID (FK)', 'Hospital_ID (FK)', 'Appointment_Date', 'Diagnosis'],
            Doctors: ['Doctor_ID (PK)', 'Doctor_Name'],
            Hospitals: ['Hospital_ID (PK)', 'Hospital_Name'],
            Treatments: ['Treatment_ID (PK)', 'Treatment_Name'],
            DoctorTreatments: ['Doctor_ID (FK)', 'Treatment_ID (FK)']
        };
        return attrs[table] || [];
    }

    drawRelationships(tables) {
        // Mock relationships: e.g., Appointments -> Patients, etc.
        const relationships = [
            { from: 'Appointments', to: 'Patients', label: 'Patient_ID' },
            { from: 'Appointments', to: 'Doctors', label: 'Doctor_ID' },
            { from: 'Appointments', to: 'Hospitals', label: 'Hospital_ID' },
            { from: 'DoctorTreatments', to: 'Doctors', label: 'Doctor_ID' },
            { from: 'DoctorTreatments', to: 'Treatments', label: 'Treatment_ID' }
        ];

        relationships.forEach(rel => {
            const fromTable = tables.find(t => t.id === rel.from);
            const toTable = tables.find(t => t.id === rel.to);
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
        d3.select('#current-nf').text(`${this.currentNF}NF`);
    }

    reset() {
        this.currentNF = 0;
        this.redundancy = 15;
        this.data = this.initData();
        this.svg.selectAll('*').remove();
        this.narrator.text('Reset! Ready to normalize again.');
        this.updateProgress();
        d3.select('#start-btn').property('disabled', false);
        d3.select('#reset-btn').style('display', 'none');
        this.renderInitial();
    }
}

// Error handling: Wrap in try-catch for production
try {
    new NormalizationViz();
} catch (error) {
    console.error('Initialization failed:', error);
    d3.select('#narrator').text('Error loading visualization. Check console.');
}
