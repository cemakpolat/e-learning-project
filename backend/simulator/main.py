#!/usr/bin/env python3
import requests
import random
import json
import time
from datetime import datetime, timedelta
from faker import Faker
import logging
import tenacity
import os
import yaml

# Initialize Faker for generating realistic data
fake = Faker()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load configuration from YAML file
def load_config(filepath="config.yaml"):
    """Load configuration settings from a YAML file."""
    try:
        with open(filepath, "r") as f:
            config = yaml.safe_load(f)
        return config
    except FileNotFoundError:
        logging.error(f"Configuration file not found: {filepath}")
        return {}
    except yaml.YAMLError as e:
        logging.error(f"Error parsing configuration file: {e}")
        return {}

config = load_config()

# API base URL - change to your actual API URL
BASE_URL = os.environ.get("API_URL", config.get("api_url","http://localhost:3000/api"))

# Constants for data generation
NUM_ADMINS = config.get("num_admins", 1)
NUM_INSTRUCTORS = config.get("num_instructors", 3)
NUM_STUDENTS = config.get("num_students", 6)
NUM_COURSES_PER_INSTRUCTOR = config.get("num_courses_per_instructor", 2)
NUM_CONTENT_ITEMS_PER_COURSE = config.get("num_content_items_per_course", 5)
COURSE_TOPICS = config.get("course_topics", [
    "Web Development", "Data Science", "Machine Learning",
    "Mobile Development", "DevOps", "Cloud Computing"
])
CONTENT_TYPES = config.get("content_types", ["video", "pdf", "quiz", "assignment", "text"])

#User Password
USER_PASSWORDS = config.get("user_passwords",{
    "admin" : "admin123",
    "instructor" : "instructor123",
    "student" : "student123"
})

# Time between activities (in seconds)
MIN_DELAY = config.get("min_delay", 1)
MAX_DELAY = config.get("max_delay", 5)

# Store tokens for authentication
auth_tokens = {}

@tenacity.retry(stop=tenacity.stop_after_attempt(3), wait=tenacity.wait_exponential(multiplier=1, min=4, max=10))
def api_call(method, url, headers=None, json=None):
    """Generic function to make API calls with retry logic."""
    try:
        response = requests.request(method, url, headers=headers, json=json)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        return response.json()
    except requests.exceptions.RequestException as e:
        logging.error(f"API call failed: {e}")
        return None

def get_user_credentials(role):
    """Gets the user credentials based on roles"""
    return USER_PASSWORDS[role]

def create_user(role, i):
    """Create a single user of a given role."""
    user_data = {
        "name": fake.name(),
        "email": f"{role}{i + 1}@lms.com",
        "password": get_user_credentials(role),
        "role": role
    }
    return user_data

def register_and_login_user(user_data):
    """Register a user and then log them in to obtain an authentication token."""
    response = api_call("POST", f"{BASE_URL}/users", json=user_data)

    if response:
        user = response
        logging.info(f"Created {user_data['role']} user: {user['email']}")

        # Login and store token
        login_response = api_call("POST", f"{BASE_URL}/users/login", json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        if login_response and 'token' in login_response:
            auth_tokens[user['id']] = login_response['token']
            return user
        else:
            logging.error(f"Failed to login user {user_data['email']}")
            return None
    else:
        logging.error(f"Failed to create {user_data['role']} user")
        return None

def create_users():
    """Create admin, instructor, and student users"""
    users = []

    # Create admin users
    for i in range(NUM_ADMINS):
        user_data = create_user("admin", i)
        user = register_and_login_user(user_data)
        if user:
            users.append(user)

    # Create instructor users
    for i in range(NUM_INSTRUCTORS):
        user_data = create_user("instructor", i)
        user = register_and_login_user(user_data)
        if user:
            users.append(user)

    # Create student users
    for i in range(NUM_STUDENTS):
        user_data = create_user("student", i)
        user = register_and_login_user(user_data)
        if user:
            users.append(user)
    return users

def create_courses(users):
    """Create courses by instructor users"""
    courses = []

    instructors = [user for user in users if user["role"] == "instructor"]

    for instructor in instructors:
        for i in range(NUM_COURSES_PER_INSTRUCTOR):
            topic = random.choice(COURSE_TOPICS)
            course_data = {
                "title": f"{topic}",
                "description": fake.paragraph(nb_sentences=3),
                "instructor_id": instructor["id"]  # Add instructor_id
            }

            # Use instructor's token for authorization
            headers = {"Authorization": f"Bearer {auth_tokens[instructor['id']]}"}
            response = api_call("POST", f"{BASE_URL}/courses", json=course_data, headers=headers)

            if response:
                course = response
                courses.append(course)
                logging.info(f"Created course: {course['title']} by instructor ID {instructor['id']}")
            else:
                logging.error("Failed to create course")

    return courses

def create_course_content(courses):
    """Create content for each course"""
    content_items = []

    for course in courses:
        instructor_id = course["instructor_id"]
        headers = {"Authorization": f"Bearer {auth_tokens[instructor_id]}"}

        for order in range(1, NUM_CONTENT_ITEMS_PER_COURSE + 1):
            content_type = random.choice(CONTENT_TYPES)
            content_data = generate_content_data(content_type)

            content_item_data = {
                "course_id": course["id"],
                "type": content_type,
                "content": content_data,
                "order": order
            }

            response = api_call(
                "POST",
                f"{BASE_URL}/course-content",
                json=content_item_data,
                headers=headers
            )

            if response:
                content_item = response
                content_items.append(content_item)
                logging.info(f"Created {content_type} content for course ID {course['id']} order {order}")
            else:
                logging.error("Failed to create course content")

    return content_items

def generate_content_data(content_type):
    """Generate content data based on content type."""
    if content_type == "video":
        content_data = {
            "url": f"https://example.com/videos/{fake.uuid4()}",
            "title": fake.sentence(),
            "duration": random.randint(300, 1800)  # 5-30 minutes
        }
    elif content_type == "pdf":
        content_data = {
            "url": f"https://example.com/pdfs/{fake.uuid4()}.pdf",
            "title": fake.sentence(),
            "pages": random.randint(5, 30)
        }
    elif content_type == "quiz":
        questions = []
        for _ in range(random.randint(5, 10)):
            questions.append({
                "question": fake.sentence(),
                "options": [fake.word() for _ in range(4)],
                "correct": random.randint(0, 3)
            })
        content_data = {
            "title": "Quiz: " + fake.sentence(),
            "questions": questions,
            "time_limit": random.randint(10, 30)  # minutes
        }
    elif content_type == "assignment":
        content_data = {
            "title": "Assignment: " + fake.sentence(),
            "description": fake.paragraph(),
            "due_days": random.randint(7, 14)
        }
    else:  # text
        content_data = {
            "title": fake.sentence(),
            "body": "\n\n".join([fake.paragraph() for _ in range(random.randint(3, 8))])
        }
    return content_data

def create_enrollments(users, courses):
    """Enroll students in courses"""
    enrollments = []

    students = [user for user in users if user["role"] == "student"]

    for student in students:
        # Each student enrolls in a random selection of courses
        num_courses_to_enroll = random.randint(1, len(courses))
        selected_courses = random.sample(courses, num_courses_to_enroll)

        # Use student's token for authorization
        headers = {"Authorization": f"Bearer {auth_tokens[student['id']]}"}

        for course in selected_courses:
            enrollment_data = {
                "course_id": course["id"]
            }

            response = api_call(
                "POST",
                f"{BASE_URL}/enrollments",
                json=enrollment_data,
                headers=headers
            )

            if response:
                enrollment = response
                enrollments.append(enrollment)
                logging.info(f"Enrolled student ID {student['id']} in course ID {course['id']}")
            else:
                logging.error("Failed to create enrollment")

    return enrollments

def update_progress(users, courses, content_items):
    """Update progress for students"""
    students = [user for user in users if user["role"] == "student"]

    for student in students:
        # Use student's token for authorization
        headers = {"Authorization": f"Bearer {auth_tokens[student['id']]}"}

        # Get student enrollments
        enrollments = get_student_enrollments(student, headers)

        for enrollment in enrollments:
            course_id = enrollment["course_id"]

            # Get content for this course
            course_content = get_course_content(course_id, headers)

            # Sort by order
            course_content.sort(key=lambda x: x["order"])

            # Decide how far the student has progressed (0-100%)
            progress_percentage = random.randint(0, 100)

            # Calculate how many content items to mark as viewed
            items_to_progress = int(len(course_content) * progress_percentage / 100)

            for i in range(items_to_progress):
                content_id = course_content[i]["id"]

                # Random time spent between 5 minutes and 1 hour (in seconds)
                time_spent = random.randint(300, 3600)

                progress_data = {
                    "course_id": course_id,
                    "content_id": content_id,
                    "time_spent": time_spent
                }

                response = api_call(
                    "POST",
                    f"{BASE_URL}/progress",
                    json=progress_data,
                    headers=headers
                )

                if response:
                    logging.info(f"Updated progress for student {student['id']} on content {content_id}")
                else:
                    logging.error("Failed to update progress")

                # Add a small delay to simulate real user behavior
                time.sleep(0.1)

def get_student_enrollments(student, headers):
    """Get enrollments for a student."""
    enrollment_response = api_call(
        "GET",
        f"{BASE_URL}/enrollments/user/{student['id']}",
        headers=headers
    )
    if enrollment_response:
        return enrollment_response
    else:
        logging.error(f"Failed to get enrollments for student {student['id']}")
        return []

def get_course_content(course_id, headers):
    """Get content for a course."""
    course_content_response = api_call(
        "GET",
        f"{BASE_URL}/course-content/course/{course_id}",
        headers=headers
    )
    if course_content_response:
        return course_content_response
    else:
        logging.error(f"Failed to get content for course {course_id}")
        return []

def create_notifications():
    """Create system notifications for users"""
    # Get all users
    admin_token = list(auth_tokens.values())[0] if auth_tokens else None

    if not admin_token:
        logging.error("No admin token available to create notifications.")
        return

    headers = {"Authorization": f"Bearer {admin_token}"}

    users = get_all_users(headers)
    if not users:
        return

    # As admin, create notifications for each user
    notification_templates = [
        "Welcome to our learning platform!",
        "Your course has been updated with new content",
        "Don't forget to complete your assignments",
        "You've earned a certificate!",
        "A new course that matches your interests is available"
    ]

    for user in users:
        # Create 1-3 notifications per user
        for _ in range(random.randint(1, 3)):
            notification_data = {
                "user_id": user["id"],
                "message": random.choice(notification_templates)
            }

            response = api_call(
                "POST",
                f"{BASE_URL}/notifications",
                json=notification_data,
                headers=headers
            )

            if response:
                logging.info(f"Created notification for user {user['id']}")
            else:
                logging.error("Failed to create notification")

def get_all_users(headers):
    """Gets all user in the system"""
    users_response = api_call("GET", f"{BASE_URL}/users", headers=headers)

    if users_response:
        return users_response
    else:
        logging.error("Failed to get users")
        return None

def simulate_student_activity(user,headers):
    """simulate student activities"""
    student_activities = [
                        "view_courses",
                        "view_content",
                        "update_progress",
                        "search_courses"
                    ]

                    # Perform 1-3 random activities
    for _ in range(random.randint(1, 3)):
        activity = random.choice(student_activities)

        if activity == "view_courses":
            # View enrolled courses
            enrollments_response = api_call(
                "GET",
                f"{BASE_URL}/enrollments/user/{user['id']}",
                headers=headers
            )

            if enrollments_response:
                enrollments = enrollments_response
                logging.info(f"Student {user['id']} viewed their {len(enrollments)} courses")

        elif activity == "view_content" or activity == "update_progress":
            # View enrolled courses first
            enrollments_response = api_call(
                "GET",
                f"{BASE_URL}/enrollments/user/{user['id']}",
                headers=headers
            )

            if enrollments_response:
                enrollments = enrollments_response

                if enrollments:
                    # Pick a random course
                    course = random.choice(enrollments)
                    course_response = api_call(
                        "GET",
                        f"{BASE_URL}/courses/{course['course_id']}",
                        headers=headers
                    )

                    if course_response:
                        logging.info(f"Student {user['id']} viewed course {course['course_id']}")

                    # View content for this course
                    content_response = api_call(
                        "GET",
                        f"{BASE_URL}/course-content/course/{course['course_id']}",
                        headers=headers
                    )

                    if content_response:
                        content_items = content_response

                        if content_items:
                            # Pick a random content item
                            content = random.choice(content_items)

                            # View content
                            api_call(
                                "GET",
                                f"{BASE_URL}/course-content/{content['id']}",
                                headers=headers
                            )
                            logging.info(f"Student {user['id']} viewed content {content['id']}")

                            # Update progress (50% chance if viewing content)
                            if activity == "update_progress" or random.random() < 0.5:
                                # Simulate spending 5-30 minutes on the content
                                time_spent = random.randint(300, 1800)

                                progress_data = {
                                    "course_id": course["course_id"],
                                    "content_id": content["id"],
                                    "time_spent": time_spent
                                }

                                progress_response = api_call(
                                    "POST",
                                    f"{BASE_URL}/progress",
                                    json=progress_data,
                                    headers=headers
                                )

                                if progress_response:
                                    logging.info(
                                        f"Student {user['id']} updated progress on content {content['id']} (+{time_spent}s)")

        elif activity == "search_courses":
            # Search for courses to enroll in
            search_terms = ["Web", "Data", "Programming", "Design", "Cloud"]
            term = random.choice(search_terms)

            search_response = api_call(
                "GET",
                f"{BASE_URL}/courses/search?q={term}",
                headers=headers
            )

            if search_response:
                search_results = search_response
                logging.info(
                    f"Student {user['id']} searched for '{term}' courses, found {len(search_results)}")

                # 10% chance to enroll in a new course if found
                if search_results and random.random() < 0.1:
                    # Check if already enrolled
                    enrollments_response = api_call(
                        "GET",
                        f"{BASE_URL}/enrollments/user/{user['id']}",
                        headers=headers
                    )

                    if enrollments_response:
                        enrollments = enrollments_response
                        enrolled_course_ids = [e["course_id"] for e in enrollments]

                        # Filter courses not already enrolled in
                        available_courses = [c for c in search_results if
                                                c["id"] not in enrolled_course_ids]

                        if available_courses:
                            course_to_enroll = random.choice(available_courses)

                            enrollment_data = {
                                "course_id": course_to_enroll["id"]
                            }

                            enrollment_response = api_call(
                                "POST",
                                f"{BASE_URL}/enrollments",
                                json=enrollment_data,
                                headers=headers
                            )

                            if enrollment_response:
                                logging.info(
                                    f"Student {user['id']} enrolled in new course {course_to_enroll['id']}")

def simulate_instructor_activity(user,headers):
    """simulate instructor activities"""
    instructor_activities = [
        "view_courses",
        "view_analytics",
        "create_content",
        "view_enrollments"
    ]

    # Perform 1-2 random activities
    for _ in range(random.randint(1, 2)):
        activity = random.choice(instructor_activities)

        # First get instructor's courses for most activities
        courses_response = api_call(
            "GET",
            f"{BASE_URL}/courses/instructor/{user['id']}",
            headers=headers
        )

        if courses_response and courses_response:
            courses = courses_response

            if activity == "view_courses":
                logging.info(f"Instructor {user['id']} viewed their {len(courses)} courses")

            elif activity == "view_analytics":
                # Pick a random course
                course = random.choice(courses)

                analytics_response = api_call(
                    "GET",
                    f"{BASE_URL}/analytics/course/{course['id']}",
                    headers=headers
                )

                if analytics_response:
                    logging.info(f"Instructor {user['id']} viewed analytics for course {course['id']}")

            elif activity == "create_content":
                # 20% chance to create new content
                if random.random() < 0.2:
                    course = random.choice(courses)

                    # Get current content to determine next order
                    content_response = api_call(
                        "GET",
                        f"{BASE_URL}/course-content/course/{course['id']}",
                        headers=headers
                    )

                    if content_response:
                        existing_content = content_response
                        next_order = len(existing_content) + 1

                        content_type = random.choice(CONTENT_TYPES)
                        content_data = generate_content_data(content_type)

                        content_item_data = {
                            "course_id": course["id"],
                            "type": content_type,
                            "content": content_data,
                            "order": next_order
                        }

                        content_response = api_call(
                            "POST",
                            f"{BASE_URL}/course-content",
                            json=content_item_data,
                            headers=headers
                        )

                        if content_response:
                            logging.info(
                                f"Instructor {user['id']} created new {content_type} content for course {course['id']}")

                            # Create notifications for enrolled students
                            enrollments_response = api_call(
                                "GET",
                                f"{BASE_URL}/enrollments/course/{course['id']}",
                                headers=headers
                            )

                            if enrollments_response:
                                enrollments = enrollments_response

                                for enrollment in enrollments:
                                    notification_data = {
                                        "user_id": enrollment["user_id"],
                                        "message": f"New content added to course: {course['title']}"
                                    }

                                    api_call(
                                        "POST",
                                        f"{BASE_URL}/notifications",
                                        json=notification_data,
                                        headers=headers
                                    )

            elif activity == "view_enrollments":
                course = random.choice(courses)

                enrollments_response = api_call(
                    "GET",
                    f"{BASE_URL}/enrollments/course/{course['id']}",
                    headers=headers
                )

                if enrollments_response:
                    enrollments = enrollments_response
                    logging.info(
                        f"Instructor {user['id']} viewed {len(enrollments)} enrollments for course {course['id']}")

def simulate_admin_activity(user,headers):
    """simulate admin activities"""
    admin_activities = [
        "view_users",
        "view_courses",
        "view_system_analytics",
        "send_notifications"
    ]

    # Perform 1-2 random activities
    for _ in range(random.randint(1, 2)):
        activity = random.choice(admin_activities)

        if activity == "view_users":
            users_response = api_call("GET", f"{BASE_URL}/users", headers=headers)

            if users_response:
                all_users = users_response
                logging.info(f"Admin {user['id']} viewed all {len(all_users)} users")

        elif activity == "view_courses":
            courses_response = api_call("GET", f"{BASE_URL}/courses", headers=headers)

            if courses_response:
                all_courses = courses_response
                logging.info(f"Admin {user['id']} viewed all {len(all_courses)} courses")

        elif activity == "view_system_analytics":
            analytics_response = api_call("GET", f"{BASE_URL}/analytics", headers=headers)

            if analytics_response:
                logging.info(f"Admin {user['id']} viewed system analytics")

        elif activity == "send_notifications":
            # 10% chance to send a system-wide notification
            if random.random() < 0.1:
                notification_templates = [
                    "System maintenance scheduled for this weekend",
                    "New courses are now available",
                    "Check out our updated user interface",
                    "Complete your profile to unlock additional features"
                ]

                message = random.choice(notification_templates)

                all_users = get_all_users(headers)

                if all_users:
                    # Send to all users
                    for target_user in all_users:
                        notification_data = {
                            "user_id": target_user["id"],
                            "message": message
                        }

                        api_call(
                            "POST",
                            f"{BASE_URL}/notifications",
                            json=notification_data,
                            headers=headers
                        )

                    logging.info(f"Admin {user['id']} sent system notification to all users")

def simulate_continuous_activity():
    """Continuously simulate real-time user activity"""
    logging.info("\n=== Starting Continuous User Activity Simulation ===")
    logging.info("Press Ctrl+C to stop the simulation")

    # Load all users only once
    admin_token = list(auth_tokens.values())[0] if auth_tokens else None
    if not admin_token:
        logging.error("No admin token available. Simulation cannot continue.")
        return

    headers = {"Authorization": f"Bearer {admin_token}"}
    all_users = get_all_users(headers)

    if not all_users:
        return

    # Track session times for users
    user_sessions = {}

    # Track user login status
    logged_in_users = set(user["id"] for user in all_users)  # Start with all users logged in

    # Simulation loop
    session_id = 1
    try:
        while True:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            logging.info(f"\n[{current_time}] Session {session_id}")

            # Determine which users are active in this session
            active_users = [user for user in all_users if user["id"] in logged_in_users and random.random() > 0.1]

            if not active_users:
                logging.info("No active users this session")
                time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
                session_id += 1
                continue

            logging.info(f"Active users: {len(active_users)}")

            # Process activity for each active user
            for user in active_users:
                headers = {"Authorization": f"Bearer {auth_tokens[user['id']]}"}

                # All users check dashboard and notifications
                dashboard_response = api_call("GET", f"{BASE_URL}/dashboard", headers=headers)
                if dashboard_response:
                    logging.info(f"User {user['id']} viewed dashboard")

                notification_response = api_call("GET", f"{BASE_URL}/notifications/user/{user['id']}", headers=headers)
                if notification_response:
                    notifications = notification_response
                    unread = [n for n in notifications if not n.get('is_read', False)]
                    if unread:
                        # Mark a random notification as read
                        notification = random.choice(unread)
                        api_call(
                            "PUT",
                            f"{BASE_URL}/notifications/{notification['id']}/read",
                            headers=headers
                        )
                        logging.info(f"User {user['id']} read notification {notification['id']}")

                # Role-specific activities
                if user["role"] == "student":
                    simulate_student_activity(user,headers)
                elif user["role"] == "instructor":
                    simulate_instructor_activity(user,headers)
                elif user["role"] == "admin":
                    simulate_admin_activity(user,headers)

                # Small delay between user activities
                time.sleep(random.uniform(0.5, 1.5))

            # Delay between sessions
            delay = random.uniform(MIN_DELAY, MAX_DELAY)
            logging.info(f"Waiting {delay:.2f} seconds until next session...")
            time.sleep(delay)
            session_id += 1

    except KeyboardInterrupt:
        logging.info("\n=== Simulation stopped by user ===")
    except Exception as e:
        logging.error(f"\n=== Simulation error: {str(e)} ===")

def setup_initial_data():
    """Sets up the initial data for the simulation."""
    logging.info("\n=== Creating Users ===")
    users = create_users()

    logging.info("\n=== Creating Courses ===")
    courses = create_courses(users)

    logging.info("\n=== Creating Course Content ===")
    content_items = create_course_content(courses)

    logging.info("\n=== Creating Enrollments ===")
    enrollments = create_enrollments(users, courses)

    logging.info("\n=== Creating Initial Progress ===")
    update_progress(users, courses, content_items)

    logging.info("\n=== Creating Notifications ===")
    create_notifications()

    logging.info("\nInitial data setup completed successfully!")
    return users

def load_existing_data():
    """Loads existing users and their tokens for continuous simulation."""
    logging.info("\n=== Loading existing users ===")

    # Get all existing users and their authentication tokens
    admin_credentials = {
        "email": config.get("admin_email", "admin1@lms.com"),  # Get admin email from config
        "password": get_user_credentials("admin")
    }

    # Login as admin to get token
    login_response = api_call("POST", f"{BASE_URL}/users/login", json=admin_credentials)
    if not login_response or 'token' not in login_response:
        logging.error("Failed to authenticate as admin. Please check credentials.")
        return None

    admin_token = login_response['token']

    # Get all users
    headers = {"Authorization": f"Bearer {admin_token}"}
    users = get_all_users(headers)

    if not users:
        logging.error("Failed to get users. Please initialize data first.")
        return None

    logging.info(f"Loaded {len(users)} existing users")

    # Get tokens for all users
    for user in users:
        user_credentials = {
            "email": user['email'],
            "password": get_user_credentials(user["role"])
        }

        login_response = api_call("POST", f"{BASE_URL}/users/login", json=user_credentials)
        if login_response and 'token' in login_response:
            auth_tokens[user['id']] = login_response['token']
            logging.info(f"Authenticated as {user['email']}")
        else:
            logging.warning(f"Failed to authenticate as {user['email']}")

    return users

def main():
    """Main function to run the data generation and continuous simulation"""
    logging.info("=== LMS Simulation Tool ===")
    logging.info("1. Initialize data (first-time setup)")
    logging.info("2. Start continuous simulation")
    choice = input("Enter your choice (1/2): ")

    if choice == "1":
        users = setup_initial_data()

        run_simulation = input("Start continuous simulation now? (y/n): ")
        if run_simulation.lower() == 'y':
            simulate_continuous_activity()

    elif choice == "2":
        if load_existing_data():
            simulate_continuous_activity()

    else:
        logging.warning("Invalid choice. Exiting.")

if __name__ == "__main__":
    main()