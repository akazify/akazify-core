-- Akazify Core Database Schema
-- Migration 001: Initial schema with ISA-95 compliant manufacturing entities

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sites table - Top level manufacturing locations
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    region VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Areas table - Manufacturing areas within sites
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    parent_area_id UUID REFERENCES areas(id),
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(site_id, code)
);

-- Work centers table - Production units where manufacturing occurs
CREATE TABLE work_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id UUID NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('PRODUCTION', 'ASSEMBLY', 'PACKAGING', 'QUALITY', 'MAINTENANCE')),
    capacity DECIMAL(10,2), -- Units per hour
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(area_id, code)
);

-- Equipment table - Machines, tools, and assets
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_center_id UUID NOT NULL REFERENCES work_centers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    equipment_type VARCHAR(20) NOT NULL CHECK (equipment_type IN ('MACHINE', 'TOOL', 'SENSOR', 'CONVEYOR', 'ROBOT', 'OTHER')),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    installation_date DATE,
    last_maintenance_date DATE,
    status VARCHAR(20) DEFAULT 'OPERATIONAL' CHECK (status IN ('OPERATIONAL', 'DOWN', 'MAINTENANCE', 'OFFLINE')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(work_center_id, code)
);

-- Products table - Items manufactured or consumed
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    uom VARCHAR(20) NOT NULL, -- Unit of Measure
    weight DECIMAL(10,4),
    dimensions JSONB, -- {length, width, height, unit}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Bill of Materials (BOM) - Product composition
CREATE TABLE boms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version_number INTEGER DEFAULT 1,
    UNIQUE(product_id, version)
);

-- BOM Items - Components in bill of materials
CREATE TABLE bom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
    component_product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(10,4) NOT NULL CHECK (quantity > 0),
    uom VARCHAR(20) NOT NULL,
    operation_sequence INTEGER,
    waste_factor DECIMAL(5,4) DEFAULT 0 CHECK (waste_factor >= 0 AND waste_factor <= 1),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Routings - Manufacturing process definitions
CREATE TABLE routings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version_number INTEGER DEFAULT 1,
    UNIQUE(product_id, version)
);

-- Routing Steps - Operations in manufacturing process
CREATE TABLE routing_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
    work_center_id UUID NOT NULL REFERENCES work_centers(id),
    operation_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sequence INTEGER NOT NULL CHECK (sequence > 0),
    setup_time INTEGER, -- Minutes
    run_time DECIMAL(8,2), -- Minutes per unit
    teardown_time INTEGER, -- Minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(routing_id, sequence)
);

-- Inventory locations
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('WAREHOUSE', 'PRODUCTION', 'SHIPPING', 'RECEIVING', 'QUALITY')),
    parent_location_id UUID REFERENCES locations(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(site_id, code)
);

-- Storage bins within locations
CREATE TABLE bins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) NOT NULL,
    capacity DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(location_id, code)
);

-- Inventory lots for traceability
CREATE TABLE lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    lot_number VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,4) NOT NULL CHECK (quantity >= 0),
    uom VARCHAR(20) NOT NULL,
    expiry_date DATE,
    manufacture_date DATE,
    supplier_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'QUARANTINED', 'EXPIRED', 'CONSUMED')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(product_id, lot_number)
);

-- Serial numbers for individual item tracking
CREATE TABLE serial_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    serial_number VARCHAR(50) NOT NULL,
    lot_id UUID REFERENCES lots(id),
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ALLOCATED', 'CONSUMED', 'SCRAPPED')),
    location_id UUID REFERENCES locations(id),
    bin_id UUID REFERENCES bins(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(product_id, serial_number)
);

-- Manufacturing Orders - Production instructions
CREATE TABLE manufacturing_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(10,4) NOT NULL CHECK (quantity > 0),
    uom VARCHAR(20) NOT NULL,
    bom_id UUID REFERENCES boms(id),
    routing_id UUID REFERENCES routings(id),
    planned_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    planned_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Manufacturing Order Operations - Individual work steps
CREATE TABLE manufacturing_order_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manufacturing_order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
    work_center_id UUID NOT NULL REFERENCES work_centers(id),
    operation_id VARCHAR(50) NOT NULL,
    sequence INTEGER NOT NULL CHECK (sequence > 0),
    planned_quantity DECIMAL(10,4) NOT NULL CHECK (planned_quantity > 0),
    completed_quantity DECIMAL(10,4) DEFAULT 0 CHECK (completed_quantity >= 0),
    status VARCHAR(20) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED')),
    planned_start_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    planned_end_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(manufacturing_order_id, sequence)
);

-- Work Orders - Maintenance and service requests
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID NOT NULL REFERENCES equipment(id),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED')),
    work_type VARCHAR(20) NOT NULL CHECK (work_type IN ('PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'INSPECTION')),
    planned_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    planned_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(8,2) CHECK (estimated_hours > 0),
    actual_hours DECIMAL(8,2) CHECK (actual_hours >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Work Order Tasks - Individual maintenance activities
CREATE TABLE work_order_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    sequence INTEGER NOT NULL CHECK (sequence > 0),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    assigned_to VARCHAR(100),
    estimated_hours DECIMAL(8,2) CHECK (estimated_hours > 0),
    actual_hours DECIMAL(8,2) CHECK (actual_hours >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    UNIQUE(work_order_id, sequence)
);

-- Create indexes for performance
CREATE INDEX idx_sites_active ON sites(is_active) WHERE is_active = true;
CREATE INDEX idx_areas_site_id ON areas(site_id);
CREATE INDEX idx_work_centers_area_id ON work_centers(area_id);
CREATE INDEX idx_equipment_work_center_id ON equipment(work_center_id);
CREATE INDEX idx_equipment_status ON equipment(status) WHERE is_active = true;

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

CREATE INDEX idx_boms_product_id ON boms(product_id);
CREATE INDEX idx_bom_items_bom_id ON bom_items(bom_id);

CREATE INDEX idx_routings_product_id ON routings(product_id);
CREATE INDEX idx_routing_steps_routing_id ON routing_steps(routing_id);
CREATE INDEX idx_routing_steps_work_center_id ON routing_steps(work_center_id);

CREATE INDEX idx_locations_site_id ON locations(site_id);
CREATE INDEX idx_bins_location_id ON bins(location_id);

CREATE INDEX idx_lots_product_id ON lots(product_id);
CREATE INDEX idx_lots_status ON lots(status) WHERE is_active = true;
CREATE INDEX idx_serial_numbers_product_id ON serial_numbers(product_id);

CREATE INDEX idx_manufacturing_orders_status ON manufacturing_orders(status);
CREATE INDEX idx_manufacturing_orders_product_id ON manufacturing_orders(product_id);
CREATE INDEX idx_manufacturing_orders_dates ON manufacturing_orders(planned_start_date, planned_end_date);

CREATE INDEX idx_mo_operations_mo_id ON manufacturing_order_operations(manufacturing_order_id);
CREATE INDEX idx_mo_operations_work_center_id ON manufacturing_order_operations(work_center_id);

CREATE INDEX idx_work_orders_equipment_id ON work_orders(equipment_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_order_tasks_wo_id ON work_order_tasks(work_order_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_centers_updated_at BEFORE UPDATE ON work_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boms_updated_at BEFORE UPDATE ON boms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bom_items_updated_at BEFORE UPDATE ON bom_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routings_updated_at BEFORE UPDATE ON routings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routing_steps_updated_at BEFORE UPDATE ON routing_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bins_updated_at BEFORE UPDATE ON bins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON lots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_serial_numbers_updated_at BEFORE UPDATE ON serial_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manufacturing_orders_updated_at BEFORE UPDATE ON manufacturing_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manufacturing_order_operations_updated_at BEFORE UPDATE ON manufacturing_order_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_order_tasks_updated_at BEFORE UPDATE ON work_order_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
