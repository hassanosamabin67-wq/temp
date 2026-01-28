import ProviderStream from "@/Components/pages/LiveStream/providerStream"
import { supabase } from "@/config/supabase"

async function page({ params }: any) {
    const { streamId } = await params

    // Fetch stream data to get room information
    const { data: streamData, error } = await supabase
        .from('live_stream')
        .select('*')
        .eq('id', streamId)
        .single()

    if (error || !streamData) {
        return <div>Stream not found</div>
    }

    // Create a minimal room object based on stream data
    const room = {
        id: streamData.room_id || streamId,
        host: streamData.host,
        room_type: "soundscape", // Default type for streams
        status: streamData.status,
        created_at: streamData.created_at
    }

    return (
        <ProviderStream startingLiveStream={false} liveStreamId={streamId} roomId={streamId} room={room} />
    )
}

export default page