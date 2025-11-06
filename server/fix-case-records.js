import prisma from './config/prisma.js'

/**
 * Script to fix case records that have incorrect doctorId
 * This will update case records to match their appointment's doctorId
 */

async function fixCaseRecords() {
  try {
    console.log('🔧 Fixing case record associations...\n')

    // Get all case records with their appointments
    const caseRecords = await prisma.caseRecord.findMany({
      include: {
        appiontement: {
          select: {
            doctorId: true,
          },
        },
      },
    })

    let fixed = 0

    for (const record of caseRecords) {
      const caseRecordDoctorId = record.doctorId
      const appointmentDoctorId = record.appiontement?.doctorId

      if (caseRecordDoctorId !== appointmentDoctorId && appointmentDoctorId) {
        await prisma.caseRecord.update({
          where: { id: record.id },
          data: { doctorId: appointmentDoctorId },
        })
        fixed++
        console.log(
          `✅ Fixed case record ${record.id}: Changed doctor from ${caseRecordDoctorId} to ${appointmentDoctorId}`
        )
      }
    }

    if (fixed === 0) {
      console.log('✨ No case records needed fixing!')
    } else {
      console.log(`\n✅ Fixed ${fixed} case records`)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixCaseRecords()
