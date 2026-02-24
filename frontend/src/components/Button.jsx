export default function Button({ text, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "10px 20px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginTop: "10px"
            }}
        >
            {text}
        </button>
    );
}
