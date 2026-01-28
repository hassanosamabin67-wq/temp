import { useState, useEffect } from 'react';

const useMediaControls = (initialMicOn = false, initialCameraOn = false) => {
    const [micOn, setMic] = useState(initialMicOn);
    const [cameraOn, setCamera] = useState(initialCameraOn);
    useEffect(() => {
        setMic(initialMicOn);
    }, [initialMicOn]);

    useEffect(() => {
        setCamera(initialCameraOn);
    }, [initialCameraOn]);
    return {
        micOn,
        setMic,
        cameraOn,
        setCamera,
    };
};

export default useMediaControls;