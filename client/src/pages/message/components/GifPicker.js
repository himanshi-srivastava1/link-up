import React, { useState, useEffect, useRef } from 'react';
import Loader from '../../../components/loader';

const TENOR_API_KEY = "LIVDSRZULELA";

function GifPicker({ onSelect }) {
    const [gifs, setGifs] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [mediaType, setMediaType] = useState('gif');
    
    useEffect(() => {
        const fetchGifs = async () => {
            setLoading(true);
            try {
                let endpoint = '';
                if (mediaType === 'sticker') {
                    const query = search.trim() ? search.trim() : 'trending';
                    endpoint = `https://g.tenor.com/v1/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(query + ' sticker')}&limit=100`;
                } else {
                    endpoint = search.trim() 
                        ? `https://g.tenor.com/v1/search?key=${TENOR_API_KEY}&q=${encodeURIComponent(search)}&limit=100`
                        : `https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=100`;
                }
                
                const response = await fetch(endpoint);
                const data = await response.json();
                if (data && data.results) {
                    setGifs(data.results);
                }
            } catch (error) {
                console.error("Error fetching GIFs:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchGifs();
        }, 500); // debounce search

        return () => clearTimeout(timeoutId);
    }, [search, mediaType]);

    return (
        <div className="gif-picker-container" style={{
            position: 'absolute',
            bottom: '70px',
            right: '20px',
            width: '300px',
            height: '450px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            padding: '10px',
            zIndex: 1000,
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <button 
                    onClick={() => setMediaType('gif')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: mediaType === 'gif' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)', color: mediaType === 'gif' ? '#000' : '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                >GIFs</button>
                <button 
                    onClick={() => setMediaType('sticker')}
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', backgroundColor: mediaType === 'sticker' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)', color: mediaType === 'sticker' ? '#000' : '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                >Stickers</button>
            </div>
            <input
                type="text"
                placeholder="Search Tenor/Giphy..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#000',
                    marginBottom: '10px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: '500'
                }}
            />
            <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '5px',
                paddingRight: '5px'
            }} className="scrollbar-container">
                {loading ? (
                    <div style={{ gridColumn: 'span 2', position: 'relative', height: '100px' }}>
                        <Loader />
                    </div>
                ) : (
                    gifs.map(gif => (
                        <img
                            key={gif.id}
                            src={gif.media[0].tinygif.url}
                            alt={gif.title || "gif"}
                            onClick={() => onSelect(gif.media[0].gif.url)}
                            style={{
                                width: '100%',
                                height: '100px',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                borderRadius: '5px'
                            }}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default GifPicker;
