#!/usr/bin/env tsx

import { createDatabasePool } from '../config/database'
import { Pool } from 'pg'

interface SampleSite {
  name: string
  code: string
  address: string
  region: string
  timezone: string
  description?: string
}

interface SampleArea {
  name: string
  code: string
  description?: string
  level: number
}

interface SampleWorkCenter {
  name: string
  code: string
  category: 'PRODUCTION' | 'ASSEMBLY' | 'PACKAGING' | 'QUALITY' | 'MAINTENANCE'
  capacity?: number
  description?: string
}

const sampleSites: SampleSite[] = [
  {
    name: 'Manufacturing Plant A',
    code: 'MPA-001',
    address: '123 Industry Drive, Detroit, MI 48201, USA',
    region: 'North America',
    timezone: 'America/Detroit',
    description: 'Primary automotive parts manufacturing facility with high-volume production lines'
  },
  {
    name: 'European Production Center',
    code: 'EPC-002',
    address: 'Industriestraße 45, 70565 Stuttgart, Germany',
    region: 'Europe',
    timezone: 'Europe/Berlin',
    description: 'Advanced manufacturing center specializing in precision engineering and quality control'
  },
  {
    name: 'Asia Pacific Hub',
    code: 'APH-003',
    address: '888 Manufacturing Blvd, Singapore 534854',
    region: 'Asia Pacific',
    timezone: 'Asia/Singapore',
    description: 'Regional manufacturing hub serving APAC markets with flexible production capabilities'
  },
  {
    name: 'Mexican Operations Center',
    code: 'MOC-004',
    address: 'Av. Industrial 567, Tijuana, Baja California, Mexico',
    region: 'North America',
    timezone: 'America/Tijuana',
    description: 'Cost-effective manufacturing facility with focus on assembly and packaging operations'
  }
]

const sampleAreas: SampleArea[] = [
  {
    name: 'Main Production Floor',
    code: 'PROD-A',
    description: 'Primary production area with automated assembly lines',
    level: 1
  },
  {
    name: 'Quality Control Lab',
    code: 'QC-LAB',
    description: 'Quality testing and inspection laboratory',
    level: 1
  },
  {
    name: 'Packaging Center',
    code: 'PACK-CTR',
    description: 'Final packaging and shipping preparation area',
    level: 1
  },
  {
    name: 'Maintenance Workshop',
    code: 'MAINT-WS',
    description: 'Equipment maintenance and repair facility',
    level: 1
  }
]

const sampleWorkCenters: SampleWorkCenter[] = [
  {
    name: 'Assembly Line 1',
    code: 'ASM-001',
    category: 'ASSEMBLY',
    capacity: 150,
    description: 'High-speed automated assembly line for primary products'
  },
  {
    name: 'CNC Machining Center',
    code: 'CNC-001',
    category: 'PRODUCTION',
    capacity: 75,
    description: '5-axis CNC machining center for precision components'
  },
  {
    name: 'Quality Inspection Station',
    code: 'QIS-001',
    category: 'QUALITY',
    capacity: 50,
    description: 'Automated quality inspection and testing station'
  },
  {
    name: 'Packaging Line A',
    code: 'PKG-A01',
    category: 'PACKAGING',
    capacity: 200,
    description: 'Primary packaging line with labeling and boxing capabilities'
  },
  {
    name: 'Maintenance Bay 1',
    code: 'MNT-B01',
    category: 'MAINTENANCE',
    capacity: 25,
    description: 'Equipment maintenance and repair station'
  },
  {
    name: 'Assembly Line 2',
    code: 'ASM-002',
    category: 'ASSEMBLY',
    capacity: 125,
    description: 'Secondary assembly line for custom configurations'
  },
  {
    name: 'Welding Station',
    code: 'WLD-001',
    category: 'PRODUCTION',
    capacity: 40,
    description: 'Robotic welding station for metal fabrication'
  },
  {
    name: 'Final Inspection',
    code: 'FIN-INS',
    category: 'QUALITY',
    capacity: 30,
    description: 'Final quality control checkpoint before packaging'
  }
]

async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding...')
  
  const pool = createDatabasePool()
  
  try {
    // Test connection
    console.log('🔌 Testing database connection...')
    await pool.query('SELECT 1')
    console.log('✅ Database connection established')

    // Clear existing data (in reverse order due to foreign keys)
    console.log('🧹 Clearing existing data...')
    await pool.query('DELETE FROM work_centers CASCADE')
    await pool.query('DELETE FROM areas CASCADE') 
    await pool.query('DELETE FROM sites CASCADE')
    console.log('✅ Existing data cleared')

    // Insert sites
    console.log('🏢 Inserting sample sites...')
    const siteInserts = sampleSites.map(async (site, index) => {
      const result = await pool.query(`
        INSERT INTO sites (name, code, address, region, timezone, description, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [site.name, site.code, site.address, site.region, site.timezone, site.description, true])
      
      console.log(`  ✅ Added site: ${site.name} (${site.code})`)
      return result.rows[0].id
    })
    
    const siteIds = await Promise.all(siteInserts)

    // Insert areas (distribute across sites)
    console.log('🏭 Inserting sample areas...')
    const areaInserts = sampleAreas.map(async (area, index) => {
      const siteId = siteIds[index % siteIds.length] // Distribute areas across sites
      const result = await pool.query(`
        INSERT INTO areas (site_id, name, code, description, level, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [siteId, area.name, area.code, area.description, area.level, true])
      
      console.log(`  ✅ Added area: ${area.name} (${area.code})`)
      return result.rows[0].id
    })
    
    const areaIds = await Promise.all(areaInserts)

    // Insert work centers (distribute across areas)
    console.log('⚙️  Inserting sample work centers...')
    const workCenterInserts = sampleWorkCenters.map(async (workCenter, index) => {
      const areaId = areaIds[index % areaIds.length] // Distribute work centers across areas
      await pool.query(`
        INSERT INTO work_centers (area_id, name, code, description, category, capacity, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [areaId, workCenter.name, workCenter.code, workCenter.description, workCenter.category, workCenter.capacity, true])
      
      console.log(`  ✅ Added work center: ${workCenter.name} (${workCenter.code})`)
    })
    
    await Promise.all(workCenterInserts)

    // Display summary
    console.log('\n📊 Seeding Summary:')
    
    const sitesCount = await pool.query('SELECT COUNT(*) FROM sites')
    const areasCount = await pool.query('SELECT COUNT(*) FROM areas') 
    const workCentersCount = await pool.query('SELECT COUNT(*) FROM work_centers')
    
    console.log(`  • Sites: ${sitesCount.rows[0].count}`)
    console.log(`  • Areas: ${areasCount.rows[0].count}`)
    console.log(`  • Work Centers: ${workCentersCount.rows[0].count}`)
    
    console.log('\n✅ Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding process completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error)
      process.exit(1)
    })
}

export { seedDatabase }
