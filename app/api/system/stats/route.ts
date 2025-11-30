import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import si from 'systeminformation'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // 1. Server Status (Implicitly Online if this code runs)
        const serverStatus = {
            status: 'Online',
            healthy: true
        }

        // 2. Database Status
        let dbStatus = {
            status: 'Disconnected',
            healthy: false
        }

        try {
            const { data, error } = await supabase.from('programs').select('count').limit(1).single()
            if (!error) {
                dbStatus = {
                    status: 'Connected',
                    healthy: true
                }
            }
        } catch (e) {
            console.error('Database check failed:', e)
        }

        // 3. CPU Usage
        let cpuStatus = {
            value: '0%',
            status: 'normal'
        }

        try {
            const load = await si.currentLoad()
            const cpuUsage = Math.round(load.currentLoad)
            cpuStatus = {
                value: `${cpuUsage}%`,
                status: cpuUsage > 80 ? 'warning' : 'normal'
            }
        } catch (e) {
            console.error('CPU check failed:', e)
            cpuStatus = { value: 'N/A', status: 'normal' }
        }

        // 4. Storage Usage
        let storageStatus = {
            value: '0 / 0 GB',
            status: 'normal'
        }

        try {
            const fsSize = await si.fsSize()
            if (fsSize && fsSize.length > 0) {
                // Use the first drive (usually root)
                const drive = fsSize[0]
                const usedGb = (drive.used / (1024 * 1024 * 1024)).toFixed(1)
                const totalGb = (drive.size / (1024 * 1024 * 1024)).toFixed(1)
                const usagePercent = drive.use

                storageStatus = {
                    value: `${usedGb}GB / ${totalGb}GB`,
                    status: usagePercent > 90 ? 'warning' : 'normal'
                }
            }
        } catch (e) {
            console.error('Storage check failed:', e)
            storageStatus = { value: 'N/A', status: 'normal' }
        }

        return NextResponse.json({
            server: serverStatus,
            database: dbStatus,
            cpu: cpuStatus,
            storage: storageStatus
        })

    } catch (error) {
        console.error('System stats error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch system stats' },
            { status: 500 }
        )
    }
}
