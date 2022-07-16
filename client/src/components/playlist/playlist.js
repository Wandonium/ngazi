import React, { useEffect, useState } from 'react';
import Loading from './loading.js';
const { BlobServiceClient } = require("@azure/storage-blob");


function Playlist(props) {

    const [videos, setVideos] = useState([]);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [inputError, setInputError] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [playlist, setPlaylist] = useState({
        title: '',
        description: '',
        image_url: '',
        videos: '',
        loadVids: false,
        save: false
    });

    useEffect(() => {
        setMsg('Getting music videos to be put into playlist...');
        setLoading(true);
        fetch(`${props.backendUrl}/api/v1/musicVideos`)
        .then(res => res.json())
        .then(data => {
            console.log('get music videos: ', data);
            let mVideos = data.videos.filter(vid => vid.playlist_id === null);
            console.log('mVideos: ', mVideos);
            setVideos(mVideos);
            setLoading(false);
        })
        .catch(err => {
            setLoading(false);
            setInputError('Failed to get music videos for playlist!');
            console.error('get music videos error: ', err);
        })
    }, []);

    useEffect(() => {
        // console.log('playlist: ', playlist);
        if(playlist.loadVids) {
            loadVideos();
        }

        if(playlist.save) {
            savePlaylist();
        }
    }, [playlist]);

    const handleChange = (event) => {
        let tmp = playlist;
        tmp[event.target.name] = event.target.value;
        setPlaylist(tmp);
    }

    const handleVideoChange = (event) => {
        setSelectedVideos(Array.from(event.target.selectedOptions, (item) => item.value));
    }

    const checkImageInput = () => {
        const imageInput = document.getElementById('image');
        const imageFile = imageInput.files[0];
        
        if (!imageFile) {
            setInputError('Image field is empty! Please select an image.' );
            return false;
        }
       
        if (!imageFile.name.match(/\.(jpg|jpeg|png|gif)$/)) {
            setInputError('Invalid image file! Please select a valid image.');
            return false;
        }

        const fsize = Math.round((imageFile.size / 1024));
        // console.log('file size: ', fsize);
        if(fsize > 5120) {
            setInputError('Fatal Error! Image file cannot be larger than 5MB');
            return false;
        }

        return true;
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        if(playlist.title === '') {
            setInputError('Please enter a title for the playlist!');
            return;
        }

        if(playlist.description === '') {
            setInputError('Please enter a description for the playlist!');
            return;
        }

        if(selectedVideos.length === 0) {
            setInputError('Please select at least one video for the playlist!');
            return;
        }

        if(!checkImageInput()) {
            return;
        }

        setInputError('');
        uploadImage();
    }

    const loadVideos = () => {
        console.log('selected videos: ', selectedVideos);
        let tmpVideos = [];
        videos.forEach(vid => {
            if(selectedVideos.includes(vid.title)) {
                tmpVideos.push(vid);
            }
        });
        console.log('tmpVideos: ', tmpVideos);
        setPlaylist({
            ...playlist, 
            videos: tmpVideos, 
            loadVids: false,
            save: true
        });
    }

    const uploadImage = () => {
        const blobService = new BlobServiceClient(
            `https://ngazi.blob.core.windows.net/${process.env.REACT_APP_BLOB_STORE_SECRET_SAS_KEY}`
          );
        const containerClient = blobService.getContainerClient("playlists");
        const imageInput = document.getElementById('image');
        const file = imageInput.files[0];
        let extension = file.name.substring(file.name.indexOf('.'), file.name.length);
        const location = playlist.title + extension;
        console.log('location: ', location);
        const imageBlobClient = containerClient.getBlockBlobClient(location);
        setMsg('Uploading playlist thumbnail, please wait....');
        setLoading(true);
        imageBlobClient.upload(file, file.size, {
            blobHTTPHeaders: {
                blobContentType: file.type
            }
        })
        .then(res => {
            let theUrl = res._response.request.url;
            console.log('image azure blob store url: ', theUrl);
            setPlaylist({...playlist, image_url: theUrl, loadVids: true});
            setLoading(false);
        }).catch(err => {
            setLoading(false);
            console.error('error uploading music video thumbnail: ', err);
        })
    }

    const savePlaylist = () => {
        console.log('playlist before saving: ', playlist);
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({...playlist})
        }

        setMsg('Saving playlist, please wait....');
        setLoading(true);
        fetch(`${props.backendUrl}/api/v1/playlist`, requestOptions)
        .then(res => res.json())
        .then(data => {
            console.log('saving playlist response: ', data);
            setLoading(false);
        })
        .catch(err => {
            console.error('saving playlist error: ', err);
            setLoading(false);
        });
    }

    return (
        <div className="top center-column">
            {
                (inputError !== '') && (
                    <p style={{color: 'red', fontSize: 16}}>
                        {inputError}
                    </p>
                )
            }
            {
                !loading && (
                    <form onSubmit={handleSubmit} className="center-column">
                        <input className="m1" type="text" name="title" placeholder="Enter playlist name" onChange={handleChange} />
                        <textarea className="m1" name="description" cols="60" rows="10" onChange={handleChange} placeholder="Enter playlist description" />
                        <div className="m1">
                            <label>Select a thumbnail for the playlist:</label>
                            <input type="file" accept="image/*" id="image"/>
                        </div>
                        <label className="m1">
                            Select videos to add to playlist:
                            <select multiple={true} value={selectedVideos} onChange={handleVideoChange}>

                                {
                                    videos.map((vid, idx) => {
                                        return (
                                            <option key={vid._id} value={vid.title}>{vid.title.substring(0, 20) + '...'}</option>
                                        )
                                    })
                                }
                            </select>
                        </label>
                        <input className="m1" type='submit' value='Submit' />
                    </form>
                )
            }
            {
                loading && (
                    <div>
                        <div style={{
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            marginTop: 20
                        }}>
                            <Loading />
                            <h1>{msg}</h1>
                            {/* <h1>{'Uploading video...  ' + progress + '%'}</h1> */}
                        </div>
                    </div>
                )
             }
        </div>
    )
}

export default Playlist