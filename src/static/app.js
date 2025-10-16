document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      // force fresh data (avoid cached responses)
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message / previous content
      activitiesList.innerHTML = "";

      // Clear activity select options except placeholder
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const desc = document.createElement("p");
        desc.textContent = details.description;
        activityCard.appendChild(desc);

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        activityCard.appendChild(schedule);

        const spotsLeft = details.max_participants - details.participants.length;
        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`;
        activityCard.appendChild(availability);

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeader = document.createElement("h5");
        participantsHeader.textContent = `Participants (${details.participants.length})`;
        participantsSection.appendChild(participantsHeader);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list no-bullets";
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-row";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = p;
            nameSpan.className = "participant-name";

            const removeBtn = document.createElement("button");
            removeBtn.className = "remove-participant";
            removeBtn.setAttribute("title", "Unregister participant");
            removeBtn.innerHTML = "&times;"; // simple X icon

            // Attach click handler to remove participant
            removeBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              e.stopPropagation();

              if (!confirm(`Remove ${p} from ${name}?`)) return;

              try {
                const resp = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, {
                  method: "DELETE",
                });

                if (resp.ok) {
                  // Refresh activities to reflect change
                  await fetchActivities();
                } else {
                  const err = await resp.json().catch(() => ({}));
                  alert(err.detail || "Failed to remove participant");
                }
              } catch (err) {
                console.error("Error removing participant:", err);
                alert("Network error while removing participant");
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(removeBtn);
            ul.appendChild(li);
          });
          participantsSection.appendChild(ul);
        } else {
          const none = document.createElement("p");
          none.className = "info";
          none.textContent = "No participants signed up yet.";
          participantsSection.appendChild(none);
        }

        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json().catch(() => ({}));

        if (response.ok) {
        messageDiv.textContent = result.message || "Signed up successfully.";
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities to reflect new participant counts
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
