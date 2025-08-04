// ManagementScript.ts - User and Group Management Interface

import { clearContentScreen, getProductName, getProductDescription } from './common.js';
import { i18n } from './i18n/TranslationService.js';

interface User {
    id: number;
    username: string;
    email: string | null;
}

interface Group {
    id: number;
    name: string;
    description: string | null;
    createdAt: string | null;
}

interface UserWithGroups {
    id: number;
    username: string;
    email: string | null;
    groups: Group[];
}

interface Role {
    id: number;
    name: string;
    description: string | null;
    permissions: string[];
    createdAt: string | null;
}

interface GroupWithRoles {
    id: number;
    name: string;
    description: string | null;
    createdAt: string | null;
    roles: Role[];
}

interface Product {
    id: number;
    name: string;
    description: string | null;
    createdAt: string | null;
}

interface ProductWithGroups {
    id: number;
    name: string;
    description: string | null;
    createdAt: string | null;
    groups: Group[];
}

interface ApiResponse<T> {
    data?: T;
    message?: string;
    error?: string;
}

const USER_MANAGEMENT_PAGE = "USER_MANAGEMENT_PAGE";
const GROUP_MANAGEMENT_PAGE = "GROUP_MANAGEMENT_PAGE";
const ROLE_MANAGEMENT_PAGE = "ROLE_MANAGEMENT_PAGE";
const PRODUCT_MANAGEMENT_PAGE = "PRODUCT_MANAGEMENT_PAGE";

class ManagementSystem {
    private userManagementContent: HTMLElement | null = null;
    private groupManagementContent: HTMLElement | null = null;
    private roleManagementContent: HTMLElement | null = null;
    private productManagementContent: HTMLElement | null = null;
    private authToken: string | null = null;

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.authToken = localStorage.getItem('authToken');
        
        // Subscribe to language changes
        i18n.subscribe(() => {
            this.refreshCurrentView();
        });
    }

    private initializeElements(): void {
        this.userManagementContent = document.getElementById('userManagementContent');
        this.groupManagementContent = document.getElementById('groupManagementContent');
        this.roleManagementContent = document.getElementById('roleManagementContent');
        this.productManagementContent = document.getElementById('productManagementContent');
    }

    private refreshCurrentView(): void {
        // Check which view is currently active and refresh it
        if (this.productManagementContent && this.productManagementContent.innerHTML.trim() !== '') {
            this.showProductManagement();
        }
        // Add other view refreshes as needed
        // if (this.userManagementContent && this.userManagementContent.innerHTML.trim() !== '') {
        //     this.showUserManagement();
        // }
        // etc.
    }

    private setupEventListeners(): void {
        const userManagementLink = document.getElementById('userManagementLink');
        const groupManagementLink = document.getElementById('groupManagementLink');
        const roleManagementLink = document.getElementById('roleManagementLink');
        const productManagementLink = document.getElementById('productManagementLink');

        userManagementLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showUserManagement();
        });

        groupManagementLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showGroupManagement();
        });

        roleManagementLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRoleManagement();
        });

        productManagementLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showProductManagement();
        });
    }

    private async makeAuthenticatedRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
        // Refresh token from localStorage in case it was updated
        this.authToken = localStorage.getItem('authToken');
        
        if (!this.authToken) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication failed. Please log in again.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response has content and is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            // For non-JSON responses (like plain text), return the text as T
            const text = await response.text();
            return text as unknown as T;
        }
    }

    private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 4000);
    }

    // User Management Functions
    public async showUserManagement(): Promise<void> {
        clearContentScreen(USER_MANAGEMENT_PAGE);
        
        if (!this.userManagementContent) return;

        try {
            const users = await this.makeAuthenticatedRequest<User[]>('/users');
            this.renderUserManagement(users);
        } catch (error) {
            console.error('Error loading users:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
            this.showNotification(`Fehler beim Laden der Benutzer: ${errorMessage}`, 'error');
        }
    }

    private renderUserManagement(users: User[]): void {
        if (!this.userManagementContent) return;

        const container = document.createElement('div');
        container.className = 'management-container';

        const header = document.createElement('div');
        header.className = 'management-header';
        header.innerHTML = `
            <h2>👥 ${i18n.t('management.userManagement')}</h2>
            <div class="management-stats">
                <div class="stat-card">
                    <div class="stat-number">${users.length}</div>
                    <div class="stat-label">${i18n.t('management.totalUsers')}</div>
                </div>
            </div>
        `;
        container.appendChild(header);

        // User List
        const userList = document.createElement('div');
        userList.className = 'user-list';

        users.forEach(user => {
            const userCard = this.createUserCard(user);
            userList.appendChild(userCard);
        });

        container.appendChild(userList);
        this.userManagementContent.appendChild(container);
    }

    private createUserCard(user: User): HTMLElement {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.setAttribute('data-user-id', user.id.toString());
        card.innerHTML = `
            <div class="user-card-header">
                <div class="user-avatar">👤</div>
                <div class="user-info">
                    <h3>${user.username}</h3>
                    <p class="user-email">${user.email || i18n.t('management.noEmail')}</p>
                </div>
                <div class="user-id">ID: ${user.id}</div>
            </div>
            <div class="user-groups-section">
                <h4>${i18n.t('management.groups')}:</h4>
                <div class="user-groups" id="userGroups-${user.id}">
                    <div class="loading-spinner">${i18n.t('management.loadingGroupsSpinner')}</div>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn-primary" onclick="managementSystem.editUserGroups(${user.id})">
                    <span class="material-icons">group</span>
                    ${i18n.t('management.manageGroups')}
                </button>
                <button class="btn-secondary" onclick="managementSystem.viewUserDetails(${user.id})">
                    <span class="material-icons">info</span>
                    ${i18n.t('management.details')}
                </button>
                <button class="btn-warning" onclick="managementSystem.changeUserPassword(${user.id}, '${user.username}')">
                    <span class="material-icons">🔑</span>
                    ${i18n.t('management.changePassword')}
                </button>
            </div>
        `;

        // Load user groups
        this.loadUserGroups(user.id);

        return card;
    }

    private async loadUserGroups(userId: number): Promise<void> {
        try {
            const groups = await this.makeAuthenticatedRequest<Group[]>(`/users/${userId}/groups`);
            const groupsContainer = document.getElementById(`userGroups-${userId}`);
            
            if (groupsContainer) {
                if (groups.length > 0) {
                    groupsContainer.innerHTML = groups.map(group => `
                        <span class="group-badge">${group.name}</span>
                    `).join('');
                } else {
                    groupsContainer.innerHTML = '<span class="no-groups">Keine Gruppen</span>';
                }
            }
        } catch (error) {
            console.error('Error loading user groups:', error);
            const groupsContainer = document.getElementById(`userGroups-${userId}`);
            if (groupsContainer) {
                groupsContainer.innerHTML = `<span class="error">${i18n.t('management.errorLoading')}</span>`;
            }
        }
    }

    // Group Management Functions
    public async showGroupManagement(): Promise<void> {
        clearContentScreen(GROUP_MANAGEMENT_PAGE);
        
        if (!this.groupManagementContent) return;

        try {
            const groups = await this.makeAuthenticatedRequest<Group[]>('/groups');
            this.renderGroupManagement(groups);
        } catch (error) {
            console.error('Error loading groups:', error);
            this.showNotification(i18n.t('management.errorLoadingGroups'), 'error');
        }
    }

    private renderGroupManagement(groups: Group[]): void {
        if (!this.groupManagementContent) return;

        const container = document.createElement('div');
        container.className = 'management-container';

        const header = document.createElement('div');
        header.className = 'management-header';
        header.innerHTML = `
            <h2>🏷️ ${i18n.t('management.groupManagement')}</h2>
            <div class="management-stats">
                <div class="stat-card">
                    <div class="stat-number">${groups.length}</div>
                    <div class="stat-label">${i18n.t('management.totalGroups')}</div>
                </div>
            </div>
            <div class="management-actions">
                <button class="btn-success" onclick="managementSystem.showCreateGroupDialog()">
                    <span class="material-icons">add</span>
                    ${i18n.t('management.createNewGroup')}
                </button>
            </div>
        `;
        container.appendChild(header);

        // Group List
        const groupList = document.createElement('div');
        groupList.className = 'group-list';

        groups.forEach(group => {
            const groupCard = this.createGroupCard(group);
            groupList.appendChild(groupCard);
        });

        container.appendChild(groupList);
        this.groupManagementContent.appendChild(container);
    }

    private createGroupCard(group: Group): HTMLElement {
        const card = document.createElement('div');
        card.className = 'group-card';
        card.setAttribute('data-group-id', group.id!.toString());
        card.innerHTML = `
            <div class="group-card-header">
                <div class="group-icon">🏷️</div>
                <div class="group-info">
                    <h3>${group.name}</h3>
                    <p class="group-description">${group.description || i18n.t('management.noDescription')}</p>
                </div>
                <div class="group-id">ID: ${group.id}</div>
            </div>
            <div class="group-members-section">
                <h4>${i18n.t('management.members')}</h4>
                <div class="group-members" id="groupMembers-${group.id}">
                    <div class="loading-spinner">${i18n.t('management.loadingMembers')}</div>
                </div>
            </div>
            <div class="group-actions">
                <button class="btn-primary" onclick="managementSystem.editGroup(${group.id})">
                    <span class="material-icons">edit</span>
                    ${i18n.t('management.edit')}
                </button>
                <button class="btn-secondary" onclick="managementSystem.manageGroupMembers(${group.id})">
                    <span class="material-icons">people</span>
                    ${i18n.t('management.manageMembers')}
                </button>
                <button class="btn-info" onclick="managementSystem.manageGroupRoles(${group.id})">
                    <span class="material-icons">security</span>
                    ${i18n.t('management.manageGroupRoles')}
                </button>
                ${group.name !== 'Single' ? `
                <button class="btn-danger" onclick="managementSystem.deleteGroup(${group.id})">
                    <span class="material-icons">delete</span>
                    ${i18n.t('management.delete')}
                </button>
                ` : ''}
            </div>
        `;

        // Load group members
        this.loadGroupMembers(group.id);

        return card;
    }

    private async loadGroupMembers(groupId: number): Promise<void> {
        try {
            const members = await this.makeAuthenticatedRequest<User[]>(`/groups/${groupId}/members`);
            const membersContainer = document.getElementById(`groupMembers-${groupId}`);
            
            if (membersContainer) {
                if (members.length > 0) {
                    membersContainer.innerHTML = members.map(member => `
                        <span class="member-badge">${member.username}</span>
                    `).join('');
                } else {
                    membersContainer.innerHTML = `<span class="no-members">${i18n.t('management.noMembers')}</span>`;
                }
            }
        } catch (error) {
            console.error('Error loading group members:', error);
            const membersContainer = document.getElementById(`groupMembers-${groupId}`);
            if (membersContainer) {
                membersContainer.innerHTML = '<span class="error">Fehler beim Laden</span>';
            }
        }
    }

    // Dialog and Modal Functions
    public showCreateGroupDialog(): void {
        const dialog = document.createElement('div');
        dialog.className = 'management-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>🏷️ Neue Gruppe erstellen</h3>
                    <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="dialog-body">
                    <div class="form-group">
                        <label for="groupName">Gruppenname:</label>
                        <input type="text" id="groupName" placeholder="Gruppenname eingeben" required>
                    </div>
                    <div class="form-group">
                        <label for="groupDescription">Beschreibung:</label>
                        <textarea id="groupDescription" placeholder="Beschreibung (optional)"></textarea>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-success" onclick="managementSystem.createGroup()">
                        <span class="material-icons">save</span>
                        Erstellen
                    </button>
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Abbrechen
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Focus on name input
        setTimeout(() => {
            const nameInput = document.getElementById('groupName') as HTMLInputElement;
            nameInput?.focus();
        }, 100);
    }

    public async createGroup(): Promise<void> {
        const nameInput = document.getElementById('groupName') as HTMLInputElement;
        const descriptionInput = document.getElementById('groupDescription') as HTMLTextAreaElement;

        if (!nameInput || !nameInput.value.trim()) {
            this.showNotification(i18n.t('management.pleaseEnterGroupName'), 'error');
            return;
        }

        try {
            const group: Partial<Group> = {
                name: nameInput.value.trim(),
                description: descriptionInput?.value.trim() || null
            };

            await this.makeAuthenticatedRequest('/groups', {
                method: 'POST',
                body: JSON.stringify(group)
            });

            this.showNotification(i18n.t('management.groupSuccessfullyCreated'), 'success');
            
            // Remove dialog
            const dialog = document.querySelector('.management-dialog');
            dialog?.remove();
            
            // Refresh group management view
            this.showGroupManagement();
        } catch (error) {
            console.error('Error creating group:', error);
            this.showNotification(i18n.t('management.errorCreatingGroup'), 'error');
        }
    }

    public async editGroup(groupId: number): Promise<void> {
        try {
            const group = await this.makeAuthenticatedRequest<Group>(`/groups/${groupId}`);
            
            const dialog = document.createElement('div');
            dialog.className = 'management-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3>🏷️ ${i18n.t('management.editGroup')}</h3>
                        <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="dialog-body">
                        <div class="form-group">
                            <label for="editGroupName">Gruppenname:</label>
                            <input type="text" id="editGroupName" value="${group.name}" ${group.name === 'Single' ? 'readonly' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="editGroupDescription">Beschreibung:</label>
                            <textarea id="editGroupDescription">${group.description || ''}</textarea>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="btn-success" onclick="managementSystem.updateGroup(${groupId})">
                            <span class="material-icons">save</span>
                            Speichern
                        </button>
                        <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                            Abbrechen
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);
        } catch (error) {
            console.error('Error loading group:', error);
            this.showNotification(i18n.t('management.errorLoadingGroup'), 'error');
        }
    }

    public async updateGroup(groupId: number): Promise<void> {
        const nameInput = document.getElementById('editGroupName') as HTMLInputElement;
        const descriptionInput = document.getElementById('editGroupDescription') as HTMLTextAreaElement;

        if (!nameInput || !nameInput.value.trim()) {
            this.showNotification(i18n.t('management.pleaseEnterGroupName'), 'error');
            return;
        }

        try {
            const group: Partial<Group> = {
                name: nameInput.value.trim(),
                description: descriptionInput?.value.trim() || null
            };

            await this.makeAuthenticatedRequest(`/groups/${groupId}`, {
                method: 'PUT',
                body: JSON.stringify(group)
            });

            this.showNotification(i18n.t('management.groupSuccessfullyUpdated'), 'success');
            
            // Remove dialog
            const dialog = document.querySelector('.management-dialog');
            dialog?.remove();
            
            // Refresh group management view
            this.showGroupManagement();
        } catch (error) {
            console.error('Error updating group:', error);
            this.showNotification(i18n.t('management.errorUpdatingGroup'), 'error');
        }
    }

    public async deleteGroup(groupId: number): Promise<void> {
        if (!confirm(i18n.t('management.confirmDeleteGroup'))) {
            return;
        }

        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}`, {
                method: 'DELETE'
            });

            this.showNotification(i18n.t('management.groupSuccessfullyDeleted'), 'success');
            this.showGroupManagement();
        } catch (error) {
            console.error('Error deleting group:', error);
            this.showNotification(i18n.t('management.errorDeletingGroup'), 'error');
        }
    }

    // Group Members Management
    public async manageGroupMembers(groupId: number): Promise<void> {
        try {
            const [group, allUsers, currentMembers] = await Promise.all([
                this.makeAuthenticatedRequest<Group>(`/groups/${groupId}`),
                this.makeAuthenticatedRequest<User[]>('/users'),
                this.makeAuthenticatedRequest<User[]>(`/groups/${groupId}/members`)
            ]);

            this.showGroupMembersDialog(group, allUsers, currentMembers);
        } catch (error) {
            console.error('Error loading group members management:', error);
            this.showNotification(i18n.t('management.errorLoadingGroupMembers'), 'error');
        }
    }

    private showGroupMembersDialog(group: Group, allUsers: User[], currentMembers: User[]): void {
        const memberIds = new Set(currentMembers.map(member => member.id));
        const availableUsers = allUsers.filter(user => !memberIds.has(user.id));

        const dialog = document.createElement('div');
        dialog.className = 'management-dialog';
        dialog.innerHTML = `
            <div class="dialog-content group-members-dialog">
                <div class="dialog-header">
                    <h3>👥 ${i18n.t('management.manageMembers')}: ${group.name}</h3>
                    <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="dialog-body">
                    <div class="members-management-container">
                        <div class="current-members-section">
                            <h4>Aktuelle Mitglieder (${currentMembers.length})</h4>
                            <div class="members-list" id="currentMembersList">
                                ${currentMembers.length > 0 ? currentMembers.map(member => `
                                    <div class="member-item" data-user-id="${member.id}">
                                        <div class="member-info">
                                            <div class="member-avatar">👤</div>
                                            <div class="member-details">
                                                <div class="member-name">${member.username}</div>
                                                <div class="member-email">${member.email || 'Keine E-Mail'}</div>
                                            </div>
                                        </div>
                                        <button class="btn-danger btn-small" onclick="managementSystem.removeUserFromGroup(${member.id}, ${group.id})">
                                            <span class="material-icons">remove</span>
                                            ${i18n.t('management.remove')}
                                        </button>
                                    </div>
                                `).join('') : `<div class="no-members">${i18n.t('management.noMembersInGroup')}</div>`}
                            </div>
                        </div>
                        
                        <div class="available-users-section">
                            <h4>${i18n.t('management.availableUsers')} (${availableUsers.length})</h4>
                            <div class="users-search">
                                <input type="text" id="usersSearchInput" placeholder="Benutzer suchen..." onkeyup="managementSystem.filterAvailableUsers()">
                            </div>
                            <div class="users-list" id="availableUsersList">
                                ${availableUsers.length > 0 ? availableUsers.map(user => `
                                    <div class="user-item" data-user-id="${user.id}" data-username="${user.username.toLowerCase()}" data-email="${(user.email || '').toLowerCase()}">
                                        <div class="user-info">
                                            <div class="user-avatar">👤</div>
                                            <div class="user-details">
                                                <div class="user-name">${user.username}</div>
                                                <div class="user-email">${user.email || 'Keine E-Mail'}</div>
                                            </div>
                                        </div>
                                        <button class="btn-success btn-small" onclick="managementSystem.addUserToGroup(${user.id}, ${group.id})">
                                            <span class="material-icons">add</span>
                                            ${i18n.t('management.add')}
                                        </button>
                                    </div>
                                `).join('') : '<div class="no-users">Alle Benutzer sind bereits Mitglieder</div>'}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        ${i18n.t('management.close')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    public async addUserToGroup(userId: number, groupId: number): Promise<void> {
        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}/members/${userId}`, {
                method: 'POST'
            });

            this.showNotification(i18n.t('management.userSuccessfullyAddedToGroup'), 'success');
            
            // Refresh the dialog
            const dialog = document.querySelector('.management-dialog');
            if (dialog) {
                dialog.remove();
                this.manageGroupMembers(groupId);
            }
            
            // Refresh the main group management view
            this.refreshGroupCard(groupId);
            
            // Refresh product menu visibility for current user (in case they were added to a group)
            if (window.authenticationSystem) {
                await window.authenticationSystem.refreshProductMenuVisibility();
            }
        } catch (error) {
            console.error('Error adding user to group:', error);
            this.showNotification(i18n.t('management.errorAddingUserToGroup'), 'error');
        }
    }

    public async removeUserFromGroup(userId: number, groupId: number): Promise<void> {
        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}/members/${userId}`, {
                method: 'DELETE'
            });

            this.showNotification(i18n.t('management.userSuccessfullyRemovedFromGroup'), 'success');
            
            // Refresh the dialog
            const dialog = document.querySelector('.management-dialog');
            if (dialog) {
                dialog.remove();
                this.manageGroupMembers(groupId);
            }
            
            // Refresh the main group management view
            this.refreshGroupCard(groupId);
            
            // Refresh product menu visibility for current user (in case they were removed from a group)
            if (window.authenticationSystem) {
                await window.authenticationSystem.refreshProductMenuVisibility();
            }
        } catch (error) {
            console.error('Error removing user from group:', error);
            this.showNotification(i18n.t('management.errorRemovingUserFromGroup'), 'error');
        }
    }

    public filterAvailableUsers(): void {
        const searchInput = document.getElementById('usersSearchInput') as HTMLInputElement;
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const userItems = document.querySelectorAll('#availableUsersList .user-item');

        userItems.forEach(item => {
            const element = item as HTMLElement;
            const username = element.dataset.username || '';
            const email = element.dataset.email || '';
            
            if (username.includes(searchTerm) || email.includes(searchTerm)) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    }

    private async refreshGroupCard(groupId: number): Promise<void> {
        try {
            // Find the specific group card in the DOM
            const groupCard = document.querySelector(`[data-group-id="${groupId}"]`);
            if (!groupCard) {
                // If card not found, refresh the entire view
                this.showGroupManagement();
                return;
            }

            // Reload the group members
            await this.loadGroupMembers(groupId);
        } catch (error) {
            console.error('Error refreshing group card:', error);
            // Fallback to full refresh
            this.showGroupManagement();
        }
    }

    // User Groups Management
    public async editUserGroups(userId: number): Promise<void> {
        try {
            const [user, allGroups, currentGroups] = await Promise.all([
                this.makeAuthenticatedRequest<User>(`/users/${userId}`),
                this.makeAuthenticatedRequest<Group[]>('/groups'),
                this.makeAuthenticatedRequest<Group[]>(`/users/${userId}/groups`)
            ]);

            this.showUserGroupsDialog(user, allGroups, currentGroups);
        } catch (error) {
            console.error('Error loading user groups management:', error);
            this.showNotification(i18n.t('management.errorLoadingUserGroups'), 'error');
        }
    }

    private showUserGroupsDialog(user: User, allGroups: Group[], currentGroups: Group[]): void {
        const groupIds = new Set(currentGroups.map(group => group.id));
        const availableGroups = allGroups.filter(group => !groupIds.has(group.id));

        const dialog = document.createElement('div');
        dialog.className = 'management-dialog';
        dialog.innerHTML = `
            <div class="dialog-content user-groups-dialog">
                <div class="dialog-header">
                    <h3>🏷️ ${i18n.t('management.manageGroups')}: ${user.username}</h3>
                    <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="dialog-body">
                    <div class="groups-management-container">
                        <div class="current-groups-section">
                            <h4>Aktuelle Gruppen (${currentGroups.length})</h4>
                            <div class="groups-list" id="currentGroupsList">
                                ${currentGroups.length > 0 ? currentGroups.map(group => `
                                    <div class="group-item" data-group-id="${group.id}">
                                        <div class="group-info">
                                            <div class="group-avatar">🏷️</div>
                                            <div class="group-details">
                                                <div class="group-name">${group.name}</div>
                                                <div class="group-description">${group.description || 'Keine Beschreibung'}</div>
                                            </div>
                                        </div>
                                        <button class="btn-danger btn-small" onclick="managementSystem.removeGroupFromUser(${user.id}, ${group.id})">
                                            <span class="material-icons">remove</span>
                                            ${i18n.t('management.remove')}
                                        </button>
                                    </div>
                                `).join('') : '<div class="no-groups">Keine Gruppen zugewiesen</div>'}
                            </div>
                        </div>
                        
                        <div class="available-groups-section">
                            <h4>${i18n.t('management.availableGroups')} (${availableGroups.length})</h4>
                            <div class="groups-search">
                                <input type="text" id="groupsSearchInput" placeholder="Gruppen suchen..." onkeyup="managementSystem.filterAvailableGroups()">
                            </div>
                            <div class="groups-list" id="availableGroupsList">
                                ${availableGroups.length > 0 ? availableGroups.map(group => `
                                    <div class="group-item" data-group-id="${group.id}" data-groupname="${group.name.toLowerCase()}" data-description="${(group.description || '').toLowerCase()}">
                                        <div class="group-info">
                                            <div class="group-avatar">🏷️</div>
                                            <div class="group-details">
                                                <div class="group-name">${group.name}</div>
                                                <div class="group-description">${group.description || 'Keine Beschreibung'}</div>
                                            </div>
                                        </div>
                                        <button class="btn-success btn-small" onclick="managementSystem.addGroupToUser(${user.id}, ${group.id})">
                                            <span class="material-icons">add</span>
                                            ${i18n.t('management.add')}
                                        </button>
                                    </div>
                                `).join('') : '<div class="no-groups">Alle Gruppen sind bereits zugewiesen</div>'}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        ${i18n.t('management.close')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    public async addGroupToUser(userId: number, groupId: number): Promise<void> {
        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}/members/${userId}`, {
                method: 'POST'
            });

            this.showNotification(i18n.t('management.groupSuccessfullyAddedToUser'), 'success');
            
            // Refresh the dialog
            const dialog = document.querySelector('.management-dialog');
            if (dialog) {
                dialog.remove();
                this.editUserGroups(userId);
            }
            
            // Refresh the main user management view
            this.refreshUserCard(userId);
        } catch (error) {
            console.error('Error adding group to user:', error);
            this.showNotification(i18n.t('management.errorAddingGroupToUser'), 'error');
        }
    }

    public async removeGroupFromUser(userId: number, groupId: number): Promise<void> {
        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}/members/${userId}`, {
                method: 'DELETE'
            });

            this.showNotification(i18n.t('management.groupSuccessfullyRemovedFromUser'), 'success');
            
            // Refresh the dialog
            const dialog = document.querySelector('.management-dialog');
            if (dialog) {
                dialog.remove();
                this.editUserGroups(userId);
            }
            
            // Refresh the main user management view
            this.refreshUserCard(userId);
        } catch (error) {
            console.error('Error removing group from user:', error);
            this.showNotification(i18n.t('management.errorRemovingGroupFromUser'), 'error');
        }
    }

    public filterAvailableGroups(): void {
        const searchInput = document.getElementById('groupsSearchInput') as HTMLInputElement;
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const groupItems = document.querySelectorAll('#availableGroupsList .group-item');

        groupItems.forEach(item => {
            const element = item as HTMLElement;
            const groupname = element.dataset.groupname || '';
            const description = element.dataset.description || '';
            
            if (groupname.includes(searchTerm) || description.includes(searchTerm)) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    }

    private async refreshUserCard(userId: number): Promise<void> {
        try {
            // Find the specific user card in the DOM
            const userCard = document.querySelector(`[data-user-id="${userId}"]`);
            if (!userCard) {
                // If card not found, refresh the entire view
                this.showUserManagement();
                return;
            }

            // Reload the user groups
            await this.loadUserGroups(userId);
        } catch (error) {
            console.error('Error refreshing user card:', error);
            // Fallback to full refresh
            this.showUserManagement();
        }
    }

    public async viewUserDetails(userId: number): Promise<void> {
        try {
            const [user, userGroups] = await Promise.all([
                this.makeAuthenticatedRequest<User>(`/users/${userId}`),
                this.makeAuthenticatedRequest<Group[]>(`/users/${userId}/groups`)
            ]);

            this.showUserDetailsDialog(user, userGroups);
        } catch (error) {
            console.error('Error loading user details:', error);
            this.showNotification(i18n.t('management.errorLoadingUserDetails'), 'error');
        }
    }

    private showUserDetailsDialog(user: User, userGroups: Group[]): void {
        const dialog = document.createElement('div');
        dialog.className = 'management-dialog';
        dialog.innerHTML = `
            <div class="dialog-content user-details-dialog">
                <div class="dialog-header">
                    <h3>👤 Benutzerdetails: ${user.username}</h3>
                    <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="dialog-body">
                    <div class="user-details-container">
                        <div class="user-details-main">
                            <div class="user-details-avatar">
                                <div class="details-avatar-large">👤</div>
                                <div class="details-avatar-info">
                                    <h2>${user.username}</h2>
                                    <p class="user-details-id">Benutzer-ID: ${user.id}</p>
                                </div>
                            </div>
                            
                            <div class="user-details-info">
                                <div class="details-section">
                                    <h4>📧 Kontaktinformationen</h4>
                                    <div class="details-row">
                                        <span class="details-label">E-Mail:</span>
                                        <span class="details-value">${user.email || 'Keine E-Mail angegeben'}</span>
                                    </div>
                                    <div class="details-row">
                                        <span class="details-label">Benutzername:</span>
                                        <span class="details-value">${user.username}</span>
                                    </div>
                                </div>
                                
                                <div class="details-section">
                                    <h4>🏷️ ${i18n.t('management.groupMemberships')} (${userGroups.length})</h4>
                                    <div class="details-groups">
                                        ${userGroups.length > 0 ? userGroups.map(group => `
                                            <div class="details-group-item">
                                                <div class="details-group-icon">🏷️</div>
                                                <div class="details-group-info">
                                                    <div class="details-group-name">${group.name}</div>
                                                    <div class="details-group-description">${group.description || 'Keine Beschreibung'}</div>
                                                </div>
                                                ${group.name === 'Single' ? '<span class="group-required-small">Standard</span>' : ''}
                                            </div>
                                        `).join('') : `<div class="no-groups-details">${i18n.t('management.noGroupMemberships')}</div>`}
                                    </div>
                                </div>
                                
                                <div class="details-section">
                                    <h4>⚙️ Aktionen</h4>
                                    <div class="details-actions">
                                        <button class="btn-primary" onclick="managementSystem.editUserGroups(${user.id}); document.querySelector('.management-dialog').remove();">
                                            <span class="material-icons">group</span>
                                            ${i18n.t('management.manageGroups')}
                                        </button>
                                        <button class="btn-secondary" onclick="managementSystem.showUserActivity(${user.id})">
                                            <span class="material-icons">history</span>
                                            ${i18n.t('management.showActivities')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        ${i18n.t('management.close')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    public showUserActivity(userId: number): void {
        this.showNotification(i18n.t('management.userActivitiesComingSoon'), 'info');
    }

    // Role Management Functions
    public async showRoleManagement(): Promise<void> {
        clearContentScreen(ROLE_MANAGEMENT_PAGE);
        
        if (!this.roleManagementContent) return;

        try {
            const roles = await this.makeAuthenticatedRequest<Role[]>('/roles');
            this.renderRoleManagement(roles);
        } catch (error) {
            console.error('Error loading roles:', error);
            this.showNotification(i18n.t('management.errorLoadingRoles'), 'error');
        }
    }

    private renderRoleManagement(roles: Role[]): void {
        if (!this.roleManagementContent) return;

        const container = document.createElement('div');
        container.className = 'management-container';

        const header = document.createElement('div');
        header.className = 'management-header';
        header.innerHTML = `
            <h2>🔐 ${i18n.t('management.roleManagement')}</h2>
            <div class="management-stats">
                <div class="stat-card">
                    <div class="stat-number">${roles.length}</div>
                    <div class="stat-label">${i18n.t('management.totalRoles')}</div>
                </div>
            </div>
            <div class="management-actions">
                <button class="btn-success" onclick="managementSystem.showCreateRoleDialog()">
                    <span class="material-icons">add</span>
                    ${i18n.t('management.createNewRole')}
                </button>
            </div>
        `;
        container.appendChild(header);

        // Role List
        const roleList = document.createElement('div');
        roleList.className = 'role-list';

        roles.forEach(role => {
            const roleCard = this.createRoleCard(role);
            roleList.appendChild(roleCard);
        });

        container.appendChild(roleList);
        this.roleManagementContent.appendChild(container);
    }

    private createRoleCard(role: Role): HTMLElement {
        const card = document.createElement('div');
        card.className = 'role-card';
        card.setAttribute('data-role-id', role.id.toString());
        card.innerHTML = `
            <div class="role-card-header">
                <div class="role-icon">🔐</div>
                <div class="role-info">
                    <h3>${role.name}</h3>
                    <p class="role-description">${role.description || 'Keine Beschreibung'}</p>
                </div>
                <div class="role-id">ID: ${role.id}</div>
            </div>
            <div class="role-permissions-section">
                <h4>${i18n.t('management.permissions')}:</h4>
                <div class="role-permissions">
                    ${role.permissions.length > 0 ? role.permissions.map(permission => `
                        <span class="permission-badge">${permission}</span>
                    `).join('') : `<span class="no-permissions">${i18n.t('management.noPermissions')}</span>`}
                </div>
            </div>
            <div class="role-groups-section">
                <h4>${i18n.t('management.assignedGroups')}:</h4>
                <div class="role-groups" id="roleGroups-${role.id}">
                    <div class="loading-spinner">${i18n.t('management.loadingGroupsSpinner')}</div>
                </div>
            </div>
            <div class="role-actions">
                <button class="btn-primary" onclick="managementSystem.editRole(${role.id})">
                    <span class="material-icons">edit</span>
                    ${i18n.t('management.edit')}
                </button>
                <button class="btn-secondary" onclick="managementSystem.manageRoleGroups(${role.id})">
                    <span class="material-icons">group</span>
                    ${i18n.t('management.manageGroups')}
                </button>
                ${['Admin', 'User', 'Guest'].includes(role.name) ? '' : `
                <button class="btn-danger" onclick="managementSystem.deleteRole(${role.id})">
                    <span class="material-icons">delete</span>
                    ${i18n.t('management.delete')}
                </button>
                `}
            </div>
        `;

        // Load role groups
        this.loadRoleGroups(role.id);

        return card;
    }

    private async loadRoleGroups(roleId: number): Promise<void> {
        try {
            const groups = await this.makeAuthenticatedRequest<Group[]>(`/roles/${roleId}/groups`);
            const groupsContainer = document.getElementById(`roleGroups-${roleId}`);
            
            if (groupsContainer) {
                if (groups.length > 0) {
                    groupsContainer.innerHTML = groups.map(group => `
                        <span class="group-badge">${group.name}</span>
                    `).join('');
                } else {
                    groupsContainer.innerHTML = '<span class="no-groups">Keine Gruppen</span>';
                }
            }
        } catch (error) {
            console.error('Error loading role groups:', error);
            const groupsContainer = document.getElementById(`roleGroups-${roleId}`);
            if (groupsContainer) {
                groupsContainer.innerHTML = `<span class="error">${i18n.t('management.errorLoading')}</span>`;
            }
        }
    }

    public showCreateRoleDialog(): void {
        const dialog = document.createElement('div');
        dialog.className = 'management-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>🔐 ${i18n.t('management.createNewRole')}</h3>
                    <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="dialog-body">
                    <div class="form-group">
                        <label for="roleName">Rollenname:</label>
                        <input type="text" id="roleName" placeholder="Rollenname eingeben" required>
                    </div>
                    <div class="form-group">
                        <label for="roleDescription">Beschreibung:</label>
                        <textarea id="roleDescription" placeholder="Beschreibung (optional)"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="rolePermissions">${i18n.t('management.permissions')}:</label>
                        <div class="permissions-container">
                            <div class="permission-checkboxes">
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="user.manage"> ${i18n.t('management.manageUsers')}
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="group.manage"> ${i18n.t('management.manageGroups')}
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="role.manage"> ${i18n.t('management.manageRoles')}
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="content.read"> ${i18n.t('management.readContent')}
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="content.create"> ${i18n.t('management.createContent')}
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="content.edit.own"> ${i18n.t('management.editOwnContent')}
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="content.edit.all"> ${i18n.t('management.editAllContent')}
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="content.delete"> ${i18n.t('management.deleteContent')}
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="content.manage"> ${i18n.t('management.manageContent')}
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="product.manage"> Produkte verwalten
                                </label>
                                <label class="permission-checkbox">
                                    <input type="checkbox" value="system.admin"> System-Administrator
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-success" onclick="managementSystem.createRole()">
                        <span class="material-icons">save</span>
                        Erstellen
                    </button>
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Abbrechen
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Focus on name input
        setTimeout(() => {
            const nameInput = document.getElementById('roleName') as HTMLInputElement;
            nameInput?.focus();
        }, 100);
    }

    public async createRole(): Promise<void> {
        const nameInput = document.getElementById('roleName') as HTMLInputElement;
        const descriptionInput = document.getElementById('roleDescription') as HTMLTextAreaElement;
        const permissionCheckboxes = document.querySelectorAll('.permission-checkbox input[type="checkbox"]:checked');

        if (!nameInput || !nameInput.value.trim()) {
            this.showNotification(i18n.t('management.pleaseEnterRoleName'), 'error');
            return;
        }

        const permissions = Array.from(permissionCheckboxes).map(checkbox => 
            (checkbox as HTMLInputElement).value
        );

        try {
            const role: Partial<Role> = {
                name: nameInput.value.trim(),
                description: descriptionInput?.value.trim() || null,
                permissions: permissions
            };

            await this.makeAuthenticatedRequest('/roles', {
                method: 'POST',
                body: JSON.stringify(role)
            });

            this.showNotification(i18n.t('management.roleSuccessfullyCreated'), 'success');
            
            // Remove dialog
            const dialog = document.querySelector('.management-dialog');
            dialog?.remove();
            
            // Refresh role management view
            this.showRoleManagement();
        } catch (error) {
            console.error('Error creating role:', error);
            this.showNotification(i18n.t('management.errorCreatingRole'), 'error');
        }
    }

    public async editRole(roleId: number): Promise<void> {
        try {
            const role = await this.makeAuthenticatedRequest<Role>(`/roles/${roleId}`);
            
            const dialog = document.createElement('div');
            dialog.className = 'management-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3>🔐 ${i18n.t('management.editRole')}</h3>
                        <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="dialog-body">
                        <div class="form-group">
                            <label for="editRoleName">${i18n.t('management.roleNameLabel')}</label>
                            <input type="text" id="editRoleName" value="${role.name}" ${['Admin', 'User', 'Guest'].includes(role.name) ? 'readonly' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="editRoleDescription">${i18n.t('management.descriptionLabel')}</label>
                            <textarea id="editRoleDescription">${role.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="editRolePermissions">${i18n.t('management.permissions')}:</label>
                            <div class="permissions-container">
                                <div class="permission-checkboxes">
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="user.manage" ${role.permissions.includes('user.manage') ? 'checked' : ''}> ${i18n.t('management.manageUsers')}
                                    </label>
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="group.manage" ${role.permissions.includes('group.manage') ? 'checked' : ''}> ${i18n.t('management.manageGroups')}
                                    </label>
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="role.manage" ${role.permissions.includes('role.manage') ? 'checked' : ''}> ${i18n.t('management.manageRoles')}
                                    </label>
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="content.read" ${role.permissions.includes('content.read') ? 'checked' : ''}> ${i18n.t('management.readContent')}
                                    </label>
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="content.create" ${role.permissions.includes('content.create') ? 'checked' : ''}> ${i18n.t('management.createContent')}
                                    </label>
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="content.edit.own" ${role.permissions.includes('content.edit.own') ? 'checked' : ''}> ${i18n.t('management.editOwnContent')}
                                    </label>
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="content.edit.all" ${role.permissions.includes('content.edit.all') ? 'checked' : ''}> ${i18n.t('management.editAllContent')}
                                    </label>
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="content.delete" ${role.permissions.includes('content.delete') ? 'checked' : ''}> ${i18n.t('management.deleteContent')}
                                    </label>
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="content.manage" ${role.permissions.includes('content.manage') ? 'checked' : ''}> ${i18n.t('management.manageContent')}
                                    </label>
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="product.manage" ${role.permissions.includes('product.manage') ? 'checked' : ''}> Produkte verwalten
                                    </label>
                                    <label class="permission-checkbox">
                                        <input type="checkbox" value="system.admin" ${role.permissions.includes('system.admin') ? 'checked' : ''}> System-Administrator
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="btn-success" onclick="managementSystem.updateRole(${roleId})">
                            <span class="material-icons">save</span>
                            Speichern
                        </button>
                        <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                            Abbrechen
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);
        } catch (error) {
            console.error('Error loading role:', error);
            this.showNotification(i18n.t('management.errorLoadingRole'), 'error');
        }
    }

    public async updateRole(roleId: number): Promise<void> {
        const nameInput = document.getElementById('editRoleName') as HTMLInputElement;
        const descriptionInput = document.getElementById('editRoleDescription') as HTMLTextAreaElement;
        const permissionCheckboxes = document.querySelectorAll('.permission-checkbox input[type="checkbox"]:checked');

        if (!nameInput || !nameInput.value.trim()) {
            this.showNotification(i18n.t('management.pleaseEnterRoleName'), 'error');
            return;
        }

        const permissions = Array.from(permissionCheckboxes).map(checkbox => 
            (checkbox as HTMLInputElement).value
        );

        try {
            const role: Partial<Role> = {
                name: nameInput.value.trim(),
                description: descriptionInput?.value.trim() || null,
                permissions: permissions
            };

            await this.makeAuthenticatedRequest(`/roles/${roleId}`, {
                method: 'PUT',
                body: JSON.stringify(role)
            });

            this.showNotification(i18n.t('management.roleSuccessfullyUpdated'), 'success');
            
            // Remove dialog
            const dialog = document.querySelector('.management-dialog');
            dialog?.remove();
            
            // Refresh role management view
            this.showRoleManagement();
        } catch (error) {
            console.error('Error updating role:', error);
            this.showNotification(i18n.t('management.errorUpdatingRole'), 'error');
        }
    }

    public async deleteRole(roleId: number): Promise<void> {
        if (!confirm(i18n.t('management.confirmDeleteRole'))) {
            return;
        }

        try {
            await this.makeAuthenticatedRequest(`/roles/${roleId}`, {
                method: 'DELETE'
            });

            this.showNotification(i18n.t('management.roleSuccessfullyDeleted'), 'success');
            this.showRoleManagement();
        } catch (error) {
            console.error('Error deleting role:', error);
            this.showNotification(i18n.t('management.errorDeletingRole'), 'error');
        }
    }

    public async manageRoleGroups(roleId: number): Promise<void> {
        try {
            const [role, allGroups, assignedGroups] = await Promise.all([
                this.makeAuthenticatedRequest<Role>(`/roles/${roleId}`),
                this.makeAuthenticatedRequest<Group[]>('/groups'),
                this.makeAuthenticatedRequest<Group[]>(`/roles/${roleId}/groups`)
            ]);

            this.showRoleGroupsDialog(role, allGroups, assignedGroups);
        } catch (error) {
            console.error('Error loading role groups management:', error);
            this.showNotification(i18n.t('management.errorLoadingRoleGroups'), 'error');
        }
    }

    private showRoleGroupsDialog(role: Role, allGroups: Group[], assignedGroups: Group[]): void {
        const assignedGroupIds = new Set(assignedGroups.map(group => group.id));
        const availableGroups = allGroups.filter(group => !assignedGroupIds.has(group.id));

        const dialog = document.createElement('div');
        dialog.className = 'management-dialog';
        dialog.innerHTML = `
            <div class="dialog-content role-groups-dialog">
                <div class="dialog-header">
                    <h3>🔐 ${i18n.t('management.manageGroups')}: ${role.name}</h3>
                    <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="dialog-body">
                    <div class="groups-management-container">
                        <div class="assigned-groups-section">
                            <h4>Zugewiesene Gruppen (${assignedGroups.length})</h4>
                            <div class="groups-list" id="assignedGroupsList">
                                ${assignedGroups.length > 0 ? assignedGroups.map(group => `
                                    <div class="group-item" data-group-id="${group.id}">
                                        <div class="group-info">
                                            <div class="group-avatar">🏷️</div>
                                            <div class="group-details">
                                                <div class="group-name">${group.name}</div>
                                                <div class="group-description">${group.description || 'Keine Beschreibung'}</div>
                                            </div>
                                        </div>
                                        <button class="btn-danger btn-small" onclick="managementSystem.removeRoleFromGroup(${role.id}, ${group.id})">
                                            <span class="material-icons">remove</span>
                                            ${i18n.t('management.remove')}
                                        </button>
                                    </div>
                                `).join('') : '<div class="no-groups">Keine Gruppen zugewiesen</div>'}
                            </div>
                        </div>
                        
                        <div class="available-groups-section">
                            <h4>${i18n.t('management.availableGroups')} (${availableGroups.length})</h4>
                            <div class="groups-search">
                                <input type="text" id="roleGroupsSearchInput" placeholder="Gruppen suchen..." onkeyup="managementSystem.filterRoleAvailableGroups()">
                            </div>
                            <div class="groups-list" id="roleAvailableGroupsList">
                                ${availableGroups.length > 0 ? availableGroups.map(group => `
                                    <div class="group-item" data-group-id="${group.id}" data-groupname="${group.name.toLowerCase()}" data-description="${(group.description || '').toLowerCase()}">
                                        <div class="group-info">
                                            <div class="group-avatar">🏷️</div>
                                            <div class="group-details">
                                                <div class="group-name">${group.name}</div>
                                                <div class="group-description">${group.description || 'Keine Beschreibung'}</div>
                                            </div>
                                        </div>
                                        <button class="btn-success btn-small" onclick="managementSystem.assignRoleToGroup(${role.id}, ${group.id})">
                                            <span class="material-icons">add</span>
                                            ${i18n.t('management.assign')}
                                        </button>
                                    </div>
                                `).join('') : '<div class="no-groups">Alle Gruppen haben bereits diese Rolle</div>'}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        ${i18n.t('management.close')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    public async assignRoleToGroup(roleId: number, groupId: number): Promise<void> {
        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}/roles/${roleId}`, {
                method: 'POST'
            });

            this.showNotification(i18n.t('management.roleSuccessfullyAssignedToGroup'), 'success');
            
            // Refresh the dialog
            const dialog = document.querySelector('.management-dialog');
            if (dialog) {
                dialog.remove();
                this.manageRoleGroups(roleId);
            }
            
            // Refresh the main role management view
            this.refreshRoleCard(roleId);
        } catch (error) {
            console.error('Error assigning role to group:', error);
            this.showNotification(i18n.t('management.errorAssigningRoleToGroup'), 'error');
        }
    }

    public async removeRoleFromGroup(roleId: number, groupId: number): Promise<void> {
        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}/roles/${roleId}`, {
                method: 'DELETE'
            });

            this.showNotification(i18n.t('management.roleSuccessfullyRemovedFromGroup'), 'success');
            
            // Refresh the dialog
            const dialog = document.querySelector('.management-dialog');
            if (dialog) {
                dialog.remove();
                this.manageRoleGroups(roleId);
            }
            
            // Refresh the main role management view
            this.refreshRoleCard(roleId);
        } catch (error) {
            console.error('Error removing role from group:', error);
            this.showNotification(i18n.t('management.errorRemovingRoleFromGroup'), 'error');
        }
    }

    public filterRoleAvailableGroups(): void {
        const searchInput = document.getElementById('roleGroupsSearchInput') as HTMLInputElement;
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const groupItems = document.querySelectorAll('#roleAvailableGroupsList .group-item');

        groupItems.forEach(item => {
            const element = item as HTMLElement;
            const groupname = element.dataset.groupname || '';
            const description = element.dataset.description || '';
            
            if (groupname.includes(searchTerm) || description.includes(searchTerm)) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    }

    private async refreshRoleCard(roleId: number): Promise<void> {
        try {
            // Find the specific role card in the DOM
            const roleCard = document.querySelector(`[data-role-id="${roleId}"]`);
            if (!roleCard) {
                // If card not found, refresh the entire view
                this.showRoleManagement();
                return;
            }

            // Reload the role groups
            await this.loadRoleGroups(roleId);
        } catch (error) {
            console.error('Error refreshing role card:', error);
            // Fallback to full refresh
            this.showRoleManagement();
        }
    }

    // Group Roles Management (from group perspective)
    public async manageGroupRoles(groupId: number): Promise<void> {
        try {
            const [group, allRoles, assignedRoles] = await Promise.all([
                this.makeAuthenticatedRequest<Group>(`/groups/${groupId}`),
                this.makeAuthenticatedRequest<Role[]>('/roles'),
                this.makeAuthenticatedRequest<Role[]>(`/groups/${groupId}/roles`)
            ]);

            this.showGroupRolesDialog(group, allRoles, assignedRoles);
        } catch (error) {
            console.error('Error loading group roles management:', error);
            this.showNotification(i18n.t('management.errorLoadingGroupRoles'), 'error');
        }
    }

    private showGroupRolesDialog(group: Group, allRoles: Role[], assignedRoles: Role[]): void {
        const assignedRoleIds = new Set(assignedRoles.map(role => role.id));
        const availableRoles = allRoles.filter(role => !assignedRoleIds.has(role.id));

        const dialog = document.createElement('div');
        dialog.className = 'management-dialog';
        dialog.innerHTML = `
            <div class="dialog-content group-roles-dialog">
                <div class="dialog-header">
                    <h3>🏷️ ${i18n.t('management.manageGroupRoles')}: ${group.name}</h3>
                    <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="dialog-body">
                    <div class="roles-management-container">
                        <div class="assigned-roles-section">
                            <h4>${i18n.t('management.assignedRoles')} (${assignedRoles.length})</h4>
                            <div class="roles-list" id="assignedRolesList">
                                ${assignedRoles.length > 0 ? assignedRoles.map(role => `
                                    <div class="role-item" data-role-id="${role.id}">
                                        <div class="role-info">
                                            <div class="role-avatar">🔐</div>
                                            <div class="role-details">
                                                <div class="role-name">${role.name}</div>
                                                <div class="role-description">${role.description || 'Keine Beschreibung'}</div>
                                                <div class="role-permissions-preview">
                                                    ${role.permissions.slice(0, 3).map(permission => `
                                                        <span class="permission-badge-small">${permission}</span>
                                                    `).join('')}
                                                    ${role.permissions.length > 3 ? `<span class="permission-more">+${role.permissions.length - 3} mehr</span>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <button class="btn-danger btn-small" onclick="managementSystem.removeRoleFromGroupDialog(${role.id}, ${group.id})">
                                            <span class="material-icons">remove</span>
                                            ${i18n.t('management.remove')}
                                        </button>
                                    </div>
                                `).join('') : '<div class="no-roles">Keine Rollen zugewiesen</div>'}
                            </div>
                        </div>
                        
                        <div class="available-roles-section">
                            <h4>${i18n.t('management.availableRoles')} (${availableRoles.length})</h4>
                            <div class="roles-search">
                                <input type="text" id="groupRolesSearchInput" placeholder="Rollen suchen..." onkeyup="managementSystem.filterGroupAvailableRoles()">
                            </div>
                            <div class="roles-list" id="groupAvailableRolesList">
                                ${availableRoles.length > 0 ? availableRoles.map(role => `
                                    <div class="role-item" data-role-id="${role.id}" data-rolename="${role.name.toLowerCase()}" data-description="${(role.description || '').toLowerCase()}">
                                        <div class="role-info">
                                            <div class="role-avatar">🔐</div>
                                            <div class="role-details">
                                                <div class="role-name">${role.name}</div>
                                                <div class="role-description">${role.description || 'Keine Beschreibung'}</div>
                                                <div class="role-permissions-preview">
                                                    ${role.permissions.slice(0, 3).map(permission => `
                                                        <span class="permission-badge-small">${permission}</span>
                                                    `).join('')}
                                                    ${role.permissions.length > 3 ? `<span class="permission-more">+${role.permissions.length - 3} mehr</span>` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <button class="btn-success btn-small" onclick="managementSystem.assignRoleToGroupDialog(${role.id}, ${group.id})">
                                            <span class="material-icons">add</span>
                                            ${i18n.t('management.assign')}
                                        </button>
                                    </div>
                                `).join('') : '<div class="no-roles">Alle Rollen sind bereits zugewiesen</div>'}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        ${i18n.t('management.close')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    public async assignRoleToGroupDialog(roleId: number, groupId: number): Promise<void> {
        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}/roles/${roleId}`, {
                method: 'POST'
            });

            this.showNotification(i18n.t('management.roleSuccessfullyAssignedToGroup'), 'success');
            
            // Refresh the dialog
            const dialog = document.querySelector('.management-dialog');
            if (dialog) {
                dialog.remove();
                this.manageGroupRoles(groupId);
            }
            
            // Refresh the main group management view
            this.refreshGroupCard(groupId);
        } catch (error) {
            console.error('Error assigning role to group:', error);
            this.showNotification(i18n.t('management.errorAssigningRoleToGroup'), 'error');
        }
    }

    public async removeRoleFromGroupDialog(roleId: number, groupId: number): Promise<void> {
        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}/roles/${roleId}`, {
                method: 'DELETE'
            });

            this.showNotification(i18n.t('management.roleSuccessfullyRemovedFromGroup'), 'success');
            
            // Refresh the dialog
            const dialog = document.querySelector('.management-dialog');
            if (dialog) {
                dialog.remove();
                this.manageGroupRoles(groupId);
            }
            
            // Refresh the main group management view
            this.refreshGroupCard(groupId);
        } catch (error) {
            console.error('Error removing role from group:', error);
            this.showNotification(i18n.t('management.errorRemovingRoleFromGroup'), 'error');
        }
    }

    public filterGroupAvailableRoles(): void {
        const searchInput = document.getElementById('groupRolesSearchInput') as HTMLInputElement;
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const roleItems = document.querySelectorAll('#groupAvailableRolesList .role-item');

        roleItems.forEach(item => {
            const element = item as HTMLElement;
            const rolename = element.dataset.rolename || '';
            const description = element.dataset.description || '';
            
            if (rolename.includes(searchTerm) || description.includes(searchTerm)) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    }

    // Product Management Methods
    public async showProductManagement(): Promise<void> {
        clearContentScreen(PRODUCT_MANAGEMENT_PAGE);
        
        if (!this.productManagementContent) {
            console.error('Product management content element not found');
            return;
        }

        this.productManagementContent.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>Produkte werden geladen...</span>
            </div>
        `;

        try {
            const products = await this.makeAuthenticatedRequest<Product[]>('/products');
            this.renderProductManagement(products);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification(i18n.t('management.errorLoadingProducts'), 'error');
            this.productManagementContent!.innerHTML = `
                <div class="error-message">
                    <span class="material-icons">error</span>
                    <h3>${i18n.t('management.errorLoadingProducts')}</h3>
                    <p>${i18n.t('management.errorOccurred')}</p>
                </div>
            `;
        }
    }

    private renderProductManagement(products: Product[]): void {
        if (!this.productManagementContent) return;

        const productCards = products.map(product => `
            <div class="product-grid-card" data-product-id="${product.id}">
                <div class="product-card-header">
                    <div class="product-icon">📦</div>
                    <h3 class="product-title">${getProductName(product.id)}</h3>
                </div>
                <div class="product-card-body">
                    <div class="product-description">
                        ${getProductDescription(product.id) || i18n.t('management.noDescription')}
                    </div>
                    <div class="product-info">
                        <div class="product-info-item">
                            <span class="info-label">${i18n.t('management.created')}:</span>
                            <span class="info-value">${product.createdAt ? new Date(product.createdAt).toLocaleDateString() : i18n.t('management.unknown')}</span>
                        </div>
                        <div class="product-info-item">
                            <span class="info-label">${i18n.t('management.groups')}:</span>
                            <span class="info-value" id="product-groups-${product.id}">${i18n.t('management.loading')}</span>
                        </div>
                    </div>
                </div>
                <div class="product-card-actions">
                    <button class="btn-secondary btn-small" onclick="managementSystem.editProduct(${product.id})" title="${i18n.t('management.edit')}">
                        <span class="material-icons">edit</span>
                        ${i18n.t('management.edit')}
                    </button>
                    <button class="btn-secondary btn-small" onclick="managementSystem.manageProductGroups(${product.id})" title="${i18n.t('management.groups')}">
                        <span class="material-icons">groups</span>
                        ${i18n.t('management.groups')}
                    </button>
                    <button class="btn-danger btn-small" onclick="managementSystem.deleteProduct(${product.id})" title="${i18n.t('management.delete')}">
                        <span class="material-icons">delete</span>
                        ${i18n.t('management.delete')}
                    </button>
                </div>
            </div>
        `).join('');

        this.productManagementContent.innerHTML = `
            <div class="product-management-container">
                <div class="product-management-header">
                    <h2>
                        <span class="material-icons">inventory</span>
                        ${i18n.t('management.productManagement')}
                    </h2>
                    <button class="btn-primary" onclick="managementSystem.createNewProduct()">
                        <span class="material-icons">add</span>
                        ${i18n.t('management.newProduct')}
                    </button>
                </div>
                <div class="product-management-stats">
                    <div class="product-stat-card">
                        <div class="stat-number">${products.length}</div>
                        <div class="stat-label">${i18n.t('management.totalProducts')}</div>
                    </div>
                </div>
                <div class="products-grid">
                    ${productCards}
                </div>
            </div>
            <style>
                .product-management-container {
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                
                .product-management-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #e0e0e0;
                }
                
                .product-management-header h2 {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                    color: #333;
                }
                
                .product-management-stats {
                    margin-bottom: 25px;
                }
                
                .product-stat-card {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .product-grid-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e0e0e0;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                
                .product-grid-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                
                .product-card-header {
                    text-align: center;
                    margin-bottom: 15px;
                }
                
                .product-icon {
                    font-size: 2.5em;
                    margin-bottom: 10px;
                }
                
                .product-title {
                    margin: 0;
                    color: #333;
                    font-size: 1.2em;
                    font-weight: 600;
                }
                
                .product-card-body {
                    margin-bottom: 20px;
                }
                
                .product-description {
                    color: #666;
                    margin-bottom: 15px;
                    line-height: 1.4;
                    text-align: center;
                    font-style: italic;
                }
                
                .product-info {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .product-info-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 5px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .info-label {
                    font-weight: 500;
                    color: #555;
                }
                
                .info-value {
                    color: #333;
                    text-align: right;
                    flex: 1;
                    margin-left: 10px;
                }
                
                .product-card-actions {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #f0f0f0;
                }
                
                .product-card-actions .btn-small {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 0.9em;
                    min-width: 80px;
                    justify-content: center;
                }
                
                .product-card-actions .material-icons {
                    font-size: 16px;
                }
                
                @media (max-width: 768px) {
                    .products-grid {
                        grid-template-columns: 1fr;
                        gap: 15px;
                    }
                    
                    .product-management-header {
                        flex-direction: column;
                        gap: 15px;
                        text-align: center;
                    }
                    
                    .product-card-actions {
                        flex-direction: column;
                        gap: 8px;
                    }
                    
                    .product-card-actions .btn-small {
                        width: 100%;
                    }
                }
            </style>
        `;

        // Load group information for each product
        products.forEach(product => {
            if (product.id) {
                this.loadProductGroups(product.id);
            }
        });
    }

    private async loadProductGroups(productId: number): Promise<void> {
        try {
            const groups = await this.makeAuthenticatedRequest<Group[]>(`/products/${productId}/groups`);
            const groupsElement = document.getElementById(`product-groups-${productId}`);
            if (groupsElement) {
                groupsElement.textContent = groups.length > 0 ? 
                    `${groups.length} Gruppe(n): ${groups.map(g => g.name).join(', ')}` : 
                    'Keine Gruppen zugewiesen';
            }
        } catch (error) {
            console.error('Error loading product groups:', error);
            const groupsElement = document.getElementById(`product-groups-${productId}`);
            if (groupsElement) {
                groupsElement.textContent = i18n.t('management.errorLoading');
            }
        }
    }

    public async createNewProduct(): Promise<void> {
        const dialog = document.createElement('div');
        dialog.className = 'management-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>📦 Neues Produkt erstellen</h3>
                    <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="dialog-body">
                    <div class="form-group">
                        <label for="productName">Produktname:</label>
                        <input type="text" id="productName" placeholder="Name des Produkts eingeben...">
                    </div>
                    <div class="form-group">
                        <label for="productDescription">Beschreibung:</label>
                        <textarea id="productDescription" placeholder="Beschreibung des Produkts eingeben..."></textarea>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-success" onclick="managementSystem.createProduct()">
                        <span class="material-icons">save</span>
                        Erstellen
                    </button>
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Abbrechen
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Focus on name input
        setTimeout(() => {
            const nameInput = document.getElementById('productName') as HTMLInputElement;
            nameInput?.focus();
        }, 100);
    }

    public async createProduct(): Promise<void> {
        const nameInput = document.getElementById('productName') as HTMLInputElement;
        const descriptionInput = document.getElementById('productDescription') as HTMLTextAreaElement;

        if (!nameInput || !nameInput.value.trim()) {
            this.showNotification(i18n.t('management.pleaseEnterProductName'), 'error');
            return;
        }

        try {
            const product: Partial<Product> = {
                name: nameInput.value.trim(),
                description: descriptionInput?.value.trim() || null
            };

            await this.makeAuthenticatedRequest('/products', {
                method: 'POST',
                body: JSON.stringify(product)
            });

            this.showNotification(i18n.t('management.productSuccessfullyCreated'), 'success');
            
            // Remove dialog
            const dialog = document.querySelector('.management-dialog');
            dialog?.remove();
            
            // Refresh product management view
            this.showProductManagement();
        } catch (error) {
            console.error('Error creating product:', error);
            this.showNotification(i18n.t('management.errorCreatingProduct'), 'error');
        }
    }

    public async editProduct(productId: number): Promise<void> {
        try {
            const product = await this.makeAuthenticatedRequest<Product>(`/products/${productId}`);
            
            const dialog = document.createElement('div');
            dialog.className = 'management-dialog';
            dialog.innerHTML = `
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3>📦 ${i18n.t('management.editProduct')}</h3>
                        <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="dialog-body">
                        <div class="form-group">
                            <label for="editProductName">Produktname:</label>
                            <input type="text" id="editProductName" value="${product.name}">
                        </div>
                        <div class="form-group">
                            <label for="editProductDescription">Beschreibung:</label>
                            <textarea id="editProductDescription">${product.description || ''}</textarea>
                        </div>
                    </div>
                    <div class="dialog-footer">
                        <button class="btn-success" onclick="managementSystem.updateProduct(${productId})">
                            <span class="material-icons">save</span>
                            Speichern
                        </button>
                        <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                            Abbrechen
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);
        } catch (error) {
            console.error('Error loading product:', error);
            this.showNotification(i18n.t('management.errorLoadingProduct'), 'error');
        }
    }

    public async updateProduct(productId: number): Promise<void> {
        const nameInput = document.getElementById('editProductName') as HTMLInputElement;
        const descriptionInput = document.getElementById('editProductDescription') as HTMLTextAreaElement;

        if (!nameInput || !nameInput.value.trim()) {
            this.showNotification(i18n.t('management.pleaseEnterProductName'), 'error');
            return;
        }

        try {
            const product: Partial<Product> = {
                name: nameInput.value.trim(),
                description: descriptionInput?.value.trim() || null
            };

            await this.makeAuthenticatedRequest(`/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify(product)
            });

            this.showNotification(i18n.t('management.productSuccessfullyUpdated'), 'success');
            
            // Remove dialog
            const dialog = document.querySelector('.management-dialog');
            dialog?.remove();
            
            // Refresh product management view
            this.showProductManagement();
        } catch (error) {
            console.error('Error updating product:', error);
            this.showNotification(i18n.t('management.errorUpdatingProduct'), 'error');
        }
    }

    public async deleteProduct(productId: number): Promise<void> {
        if (!confirm(i18n.t('management.confirmDeleteProduct'))) {
            return;
        }

        try {
            await this.makeAuthenticatedRequest(`/products/${productId}`, {
                method: 'DELETE'
            });

            this.showNotification(i18n.t('management.productSuccessfullyDeleted'), 'success');
            this.showProductManagement();
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showNotification(i18n.t('management.errorDeletingProduct'), 'error');
        }
    }

    public async manageProductGroups(productId: number): Promise<void> {
        try {
            const [product, allGroups, assignedGroups] = await Promise.all([
                this.makeAuthenticatedRequest<Product>(`/products/${productId}`),
                this.makeAuthenticatedRequest<Group[]>('/groups'),
                this.makeAuthenticatedRequest<Group[]>(`/products/${productId}/groups`)
            ]);

            this.showProductGroupsDialog(product, allGroups, assignedGroups);
        } catch (error) {
            console.error('Error loading product groups management:', error);
            this.showNotification(i18n.t('management.errorLoadingProductGroups'), 'error');
        }
    }

    private showProductGroupsDialog(product: Product, allGroups: Group[], assignedGroups: Group[]): void {
        const assignedGroupIds = new Set(assignedGroups.map(group => group.id));
        const availableGroups = allGroups.filter(group => !assignedGroupIds.has(group.id));

        const dialog = document.createElement('div');
        dialog.className = 'management-dialog';
        dialog.innerHTML = `
            <div class="dialog-content product-groups-dialog">
                <div class="dialog-header">
                    <h3>🏷️ ${i18n.t('management.manageGroups')}: ${product.name}</h3>
                    <button class="dialog-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="dialog-body">
                    <div class="groups-management-container">
                        <div class="assigned-groups-section">
                            <h4>Zugewiesene Gruppen (${assignedGroups.length})</h4>
                            <div class="groups-list" id="assignedGroupsList">
                                ${assignedGroups.length > 0 ? assignedGroups.map(group => `
                                    <div class="group-item" data-group-id="${group.id}">
                                        <div class="group-info">
                                            <div class="group-avatar">🏷️</div>
                                            <div class="group-details">
                                                <div class="group-name">${group.name}</div>
                                                <div class="group-description">${group.description || 'Keine Beschreibung'}</div>
                                            </div>
                                        </div>
                                        <button class="btn-danger btn-small" onclick="managementSystem.removeProductFromGroup(${product.id}, ${group.id})">
                                            <span class="material-icons">remove</span>
                                            ${i18n.t('management.remove')}
                                        </button>
                                    </div>
                                `).join('') : '<div class="no-groups">Keine Gruppen zugewiesen</div>'}
                            </div>
                        </div>
                        
                        <div class="available-groups-section">
                            <h4>${i18n.t('management.availableGroups')} (${availableGroups.length})</h4>
                            <div class="groups-search">
                                <input type="text" id="productGroupsSearchInput" placeholder="Gruppe suchen..." onkeyup="managementSystem.filterProductAvailableGroups()">
                            </div>
                            <div class="groups-list" id="availableGroupsList">
                                ${availableGroups.length > 0 ? availableGroups.map(group => `
                                    <div class="group-item" data-group-id="${group.id}" data-groupname="${group.name.toLowerCase()}" data-description="${(group.description || '').toLowerCase()}">
                                        <div class="group-info">
                                            <div class="group-avatar">🏷️</div>
                                            <div class="group-details">
                                                <div class="group-name">${group.name}</div>
                                                <div class="group-description">${group.description || 'Keine Beschreibung'}</div>
                                            </div>
                                        </div>
                                        <button class="btn-success btn-small" onclick="managementSystem.assignProductToGroup(${product.id}, ${group.id})">
                                            <span class="material-icons">add</span>
                                            ${i18n.t('management.add')}
                                        </button>
                                    </div>
                                `).join('') : '<div class="no-groups">Alle Gruppen sind bereits zugewiesen</div>'}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        ${i18n.t('management.close')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);
    }

    public async assignProductToGroup(productId: number, groupId: number): Promise<void> {
        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}/products/${productId}`, {
                method: 'POST'
            });

            this.showNotification(i18n.t('management.productSuccessfullyAddedToGroup'), 'success');
            
            // Refresh the dialog
            const dialog = document.querySelector('.management-dialog');
            if (dialog) {
                dialog.remove();
                this.manageProductGroups(productId);
            }
            
            // Refresh the main product management view
            this.refreshProductCard(productId);
            
            // Refresh product menu visibility for current user
            if (window.authenticationSystem) {
                await window.authenticationSystem.refreshProductMenuVisibility();
            }
        } catch (error) {
            console.error('Error assigning product to group:', error);
            this.showNotification(i18n.t('management.errorAddingProductToGroup'), 'error');
        }
    }

    public async removeProductFromGroup(productId: number, groupId: number): Promise<void> {
        try {
            await this.makeAuthenticatedRequest(`/groups/${groupId}/products/${productId}`, {
                method: 'DELETE'
            });

            this.showNotification(i18n.t('management.productSuccessfullyRemovedFromGroup'), 'success');
            
            // Refresh the dialog
            const dialog = document.querySelector('.management-dialog');
            if (dialog) {
                dialog.remove();
                this.manageProductGroups(productId);
            }
            
            // Refresh the main product management view
            this.refreshProductCard(productId);
            
            // Refresh product menu visibility for current user
            if (window.authenticationSystem) {
                await window.authenticationSystem.refreshProductMenuVisibility();
            }
        } catch (error) {
            console.error('Error removing product from group:', error);
            this.showNotification(i18n.t('management.errorRemovingProductFromGroup'), 'error');
        }
    }

    public filterProductAvailableGroups(): void {
        const searchInput = document.getElementById('productGroupsSearchInput') as HTMLInputElement;
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const groupItems = document.querySelectorAll('#availableGroupsList .group-item');

        groupItems.forEach(item => {
            const element = item as HTMLElement;
            const groupname = element.dataset.groupname || '';
            const description = element.dataset.description || '';
            
            if (groupname.includes(searchTerm) || description.includes(searchTerm)) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    }

    private async refreshProductCard(productId: number): Promise<void> {
        try {
            // Find the specific product card in the DOM
            const productCard = document.querySelector(`[data-product-id="${productId}"]`);
            if (!productCard) {
                // If card not found, refresh the entire view
                this.showProductManagement();
                return;
            }

            // Reload the product groups
            await this.loadProductGroups(productId);
        } catch (error) {
            console.error('Error refreshing product card:', error);
            // Fallback to full refresh
            this.showProductManagement();
        }
    }

    // Password Change Function
    public changeUserPassword(userId: number, username: string): void {
        // Check if user has authentication token
        const token = localStorage.getItem('authToken');
        if (!token) {
            this.showNotification('Nicht angemeldet', 'error');
            return;
        }
        
        // Create password change modal
        this.showPasswordChangeModal(userId, username);
    }
    
    private showPasswordChangeModal(userId: number, username: string): void {
        // Remove existing modal if any
        const existingModal = document.querySelector('.password-change-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.className = 'password-change-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔑 ${i18n.t('management.changePassword')}</h3>
                    <button class="modal-close" onclick="this.closest('.password-change-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p>${i18n.t('management.newPasswordForUser')} <strong>${username}</strong></p>
                    <div class="form-group">
                        <label for="newPassword">Neues Passwort:</label>
                        <input type="password" id="newPassword" placeholder="${i18n.t('management.minCharacters')}" minlength="4" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">${i18n.t('management.confirmPassword')}</label>
                        <input type="password" id="confirmPassword" placeholder="${i18n.t('management.repeatPassword')}" minlength="4" required>
                    </div>
                    <div class="password-strength">
                        <small>Das Passwort muss mindestens 4 Zeichen lang sein.</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.password-change-modal').remove()">
                        Abbrechen
                    </button>
                    <button class="btn-primary" onclick="managementSystem.executePasswordChange(${userId}, '${username}')">
                        <span class="material-icons">🔐</span>
                        ${i18n.t('management.changePassword')}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus on password input
        const passwordInput = modal.querySelector('#newPassword') as HTMLInputElement;
        if (passwordInput) {
            passwordInput.focus();
        }
        
        // Add real-time password confirmation validation
        const confirmInput = modal.querySelector('#confirmPassword') as HTMLInputElement;
        if (confirmInput && passwordInput) {
            confirmInput.addEventListener('input', () => {
                if (confirmInput.value && passwordInput.value !== confirmInput.value) {
                    confirmInput.setCustomValidity(i18n.t('management.passwordsDoNotMatch'));
                } else {
                    confirmInput.setCustomValidity('');
                }
            });
        }
        
        // Close modal when clicking overlay
        modal.querySelector('.modal-overlay')?.addEventListener('click', () => {
            modal.remove();
        });
        
        // Handle Enter key
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.executePasswordChange(userId, username);
            }
        });
    }
    
    public async executePasswordChange(userId: number, username: string): Promise<void> {
        const modal = document.querySelector('.password-change-modal');
        const passwordInput = modal?.querySelector('#newPassword') as HTMLInputElement;
        const confirmInput = modal?.querySelector('#confirmPassword') as HTMLInputElement;
        const submitButton = modal?.querySelector('.btn-primary') as HTMLButtonElement;
        
        if (!passwordInput || !confirmInput || !submitButton) {
            this.showNotification('Formular-Elemente nicht gefunden', 'error');
            return;
        }
        
        const newPassword = passwordInput.value;
        const confirmPassword = confirmInput.value;
        
        // Validation
        if (!newPassword || !confirmPassword) {
            this.showNotification(i18n.t('management.pleaseFillPasswordFields'), 'error');
            return;
        }
        
        if (newPassword.length < 4) {
            this.showNotification('Passwort muss mindestens 4 Zeichen lang sein', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showNotification(i18n.t('management.passwordsDoNotMatch'), 'error');
            return;
        }
        
        // Show loading state
        const originalButtonContent = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<span class="material-icons">⏳</span> ${i18n.t('management.changingPassword')}...`;
        
        try {
            await this.makeAuthenticatedRequest<ApiResponse<any>>('/users/password', {
                method: 'PUT',
                body: JSON.stringify({
                    userId: userId,
                    newPassword: newPassword
                })
            });
            
            // Success
            this.showNotification(`${i18n.t('management.passwordChangedSuccessfully')} - ${username}`, 'success');
            modal?.remove();
            
        } catch (error) {
            console.error('Error changing password:', error);
            let errorMessage = i18n.t('management.errorChangingPassword');
            
            if (error instanceof Error) {
                if (error.message.includes('Forbidden')) {
                    errorMessage = 'Keine Berechtigung - system.admin Rolle erforderlich';
                } else if (error.message.includes('Not Found')) {
                    errorMessage = 'Benutzer nicht gefunden';
                } else if (error.message.includes('Authentication failed')) {
                    errorMessage = i18n.t('management.authFailedRelogin');
                }
            }
            
            this.showNotification(errorMessage, 'error');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonContent;
        }
    }
}

// Global instance for onclick handlers
declare global {
    interface Window {
        managementSystem: ManagementSystem;
    }
}

// Initialize management system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.managementSystem = new ManagementSystem();
});

// Export to make this file a module (required for global augmentations)
export {};