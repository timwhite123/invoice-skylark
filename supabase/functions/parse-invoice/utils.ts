export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const createErrorResponse = (error: any, details?: string, status = 500) => {
  console.error('Error:', error)
  return new Response(
    JSON.stringify({ 
      error: 'Failed to process invoice with OpenAI',
      details: details || error.message,
      stack: error.stack
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status 
    }
  )
}

export const getSignedUrl = async (supabase: any, fileUrl: string) => {
  const filePath = fileUrl.split('/').slice(-1)[0]
  const { data: { signedUrl }, error } = await supabase
    .storage
    .from('invoice-files')
    .createSignedUrl(filePath, 60)

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }

  return signedUrl
}