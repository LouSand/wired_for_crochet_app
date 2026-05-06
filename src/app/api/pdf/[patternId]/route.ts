import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import PatternTemplate from '@/lib/pdf/PatternTemplate'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patternId: string }> }
) {
  try {
    const { patternId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch the pattern and verify ownership
    const { data: pattern, error } = await supabase
      .from('patterns')
      .select('*')
      .eq('id', patternId)
      .eq('user_id', user.id)
      .single()

    if (error || !pattern) {
      return new Response(JSON.stringify({ error: 'Pattern not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Generate PDF
    const buffer = await renderToBuffer(
      PatternTemplate({
        title: pattern.title,
        introduction: pattern.introduction,
        materials_list: pattern.materials_list,
        hook_size: pattern.hook_size,
        yarn_info: pattern.yarn_info,
        gauge: pattern.gauge,
        abbreviations: pattern.abbreviations,
        instructions: pattern.instructions,
        notes: pattern.notes,
      })
    )

    // Create a safe filename from the pattern title
    const safeTitle = pattern.title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 50)

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}-pattern.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF generation failed:', err)
    return new Response(JSON.stringify({ error: 'Failed to generate PDF' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
