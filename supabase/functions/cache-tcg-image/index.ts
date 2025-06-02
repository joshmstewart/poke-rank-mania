
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageUrl, cacheKey } = await req.json()
    
    if (!imageUrl || !cacheKey) {
      return new Response(
        JSON.stringify({ error: 'Missing imageUrl or cacheKey' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`🖼️ [CACHE_FUNCTION] Starting to cache image: ${imageUrl}`)

    // Check if already cached in storage
    const { data: existingCache } = await supabase
      .from('preview_image_cache')
      .select('storage_path, stored_in_storage')
      .eq('cache_key', cacheKey)
      .eq('stored_in_storage', true)
      .single()

    if (existingCache?.storage_path) {
      console.log(`🖼️ [CACHE_FUNCTION] Image already cached at: ${existingCache.storage_path}`)
      const { data } = supabase.storage.from('tcg-images').getPublicUrl(existingCache.storage_path)
      return new Response(
        JSON.stringify({ cachedUrl: data.publicUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Download the image
    console.log(`🖼️ [CACHE_FUNCTION] Downloading image from: ${imageUrl}`)
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }

    const imageBlob = await imageResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()
    
    // Generate storage path
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'png'
    const storagePath = `${cacheKey}.${fileExtension}`

    console.log(`🖼️ [CACHE_FUNCTION] Uploading to storage: ${storagePath}`)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('tcg-images')
      .upload(storagePath, imageBuffer, {
        contentType: imageBlob.type || 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error(`🖼️ [CACHE_FUNCTION] Upload error:`, uploadError)
      throw uploadError
    }

    console.log(`🖼️ [CACHE_FUNCTION] Successfully uploaded to: ${uploadData.path}`)

    // Update cache record
    const { error: updateError } = await supabase
      .from('preview_image_cache')
      .upsert([
        {
          cache_key: cacheKey,
          image_url: imageUrl,
          storage_path: uploadData.path,
          stored_in_storage: true,
          content_type: imageBlob.type || 'image/png',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ], {
        onConflict: 'cache_key'
      })

    if (updateError) {
      console.error(`🖼️ [CACHE_FUNCTION] Cache update error:`, updateError)
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('tcg-images').getPublicUrl(uploadData.path)

    console.log(`🖼️ [CACHE_FUNCTION] Image cached successfully. Public URL: ${urlData.publicUrl}`)

    return new Response(
      JSON.stringify({ cachedUrl: urlData.publicUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error(`🖼️ [CACHE_FUNCTION] Error:`, error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
