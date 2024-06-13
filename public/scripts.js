
const requests = [
    { userId: '665b4376cf2c9ec1693233af', username: 'john_doe' },
    { userId: '550e8400-e29b-41d4-a716-446655440001', username: 'jane_doe' },
    { userId: '550e8400-e29b-41d4-a716-446655440002', username: 'sam_smith' },
];

var serverEndpoint = "http://64.226.107.81"//64.226.107.81

async function generateRequestRows() {
    const requestList = document.getElementById('request-list');
    requestList.innerHTML = '';

    try {
        const response = await fetch(serverEndpoint + '/api/requests', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch requests');
        }

        const requests = await response.json();

        requests.forEach(request => {
            const row = document.createElement('tr');
            row.id = request._id;  

            row.innerHTML = `
                <td>${request.userId}</td>
                <td>${request.username}</td>
                <td>
                    <button class="view" onclick="viewPDF('${request.fileUrl}')">View PDF</button>
                    <button class="approve" onclick="approveRequest('${request.userId}','${request._id}')">Approve</button>
                    <button class="reject" onclick="rejectRequest('${request._id}')">Reject</button>
                </td>
            `;

            requestList.appendChild(row);
        });

        updateRequestCount();
    } catch (error) {
        console.error('Error fetching requests:', error);
    }
}

function viewPDF(pdfUrl) {
    window.open(pdfUrl, '_blank'); 
}


async function approveRequest(userId, requestId) {
    try {
        const response = await fetch(`${serverEndpoint}/api/users/approveRequest/${userId}`, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': `${localStorage.getItem('token')}`
            }
        });
        console.log("ttt ",response);
        if (response.ok) {
            markRequest(requestId, 'approved');
        } else {
            console.error('Failed to update user role:', response.status);
        }
    } catch (error) {
        console.error('Error updating user role:', error);
    }
}


function rejectRequest(requestId) {
    markRequest(requestId, 'rejected');
}

function markRequest(requestId, status) {
    const row = document.getElementById(requestId);
    if (status === 'approved') {
        row.style.backgroundColor = '#d4edda'; 
    } else if (status === 'rejected') {
        row.style.backgroundColor = '#f8d7da'; 
    }

    setTimeout(() => {
        row.style.transition = 'opacity 1s';
        row.style.opacity = '0';
        setTimeout(() => {
            row.remove();
            updateRequestCount()
            const response = fetch(`${serverEndpoint}/api/requests/${requestId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                }
            });
        }, 1000);
    }, 500);
}

function updateRequestCount() {
    const requestCount = document.getElementById('request-list').children.length;
    document.getElementById('request-count').innerText = `(${requestCount})`;
}

function logout() {
    localStorage.removeItem('token'); 
    window.location.href = 'login.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', generateRequestRows);
